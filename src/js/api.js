import JSZip from 'jszip';

const CLAUDE_MODEL  = 'claude-3-5-sonnet-20240620';
const GEMINI_MODEL  = 'gemini-1.5-flash';

function buildSystemPrompt(cats, ctx) {
  return `Eres un extractor de conocimiento especializado en crear notas Markdown de alta calidad a partir de conversaciones.

Tu tarea: analizar la conversación y extraer su conocimiento más valioso en notas .md bien estructuradas.

CATEGORÍAS DISPONIBLES: ${cats.join(', ')}

REGLAS DE FORMATO MARKDOWN:
- Cada nota debe tener frontmatter YAML al inicio:
  ---
  title: Título de la nota
  tags: [tag1, tag2]
  category: nombre-categoria
  date: YYYY-MM-DD
  ---
- Usar ## para secciones principales, ### para subsecciones
- Incluir bloques de código con triple backtick y lenguaje cuando haya comandos/código
- Usar tablas Markdown para comparaciones y datos estructurados
- Terminar cada nota con ## Referencias si hay conceptos relacionados
- Términos técnicos en inglés, contenido en español latinoamericano
- Links internos entre notas con [[NombreNota]] cuando sea relevante
- Nombres de archivo: Titulo-En-PascalCase.md (sin espacios, sin acentos)

CRITERIOS DE EXTRACCIÓN:
- Conceptos técnicos importantes → nota propia
- Proyectos o herramientas mencionadas → nota propia
- Fixes o soluciones técnicas → nota propia
- Filosofías o frameworks de pensamiento → nota propia
- Ideas o proyectos pendientes → nota en categoría "pendientes"
- NO crear notas para menciones triviales o de pasada
- Máximo 8 notas por conversación para mantener calidad sobre cantidad
- Mínimo 1 nota si hay algo valioso

RESPONDE SOLO CON JSON VÁLIDO, sin backticks, sin texto extra:
{
  "notes": [
    {
      "filename": "Nombre-Del-Archivo.md",
      "category": "tecnologia",
      "title": "Título legible",
      "tags": ["tag1", "tag2"],
      "content": "contenido markdown completo incluyendo frontmatter"
    }
  ],
  "summary": "Una línea describiendo qué se extrajo y por qué es valioso"
}
${ctx ? '\n\nCONTEXTO DEL USUARIO:\n' + ctx : ''}`;
}

// ─── PARSE ──────────────────────────────────
export function parseResponse(raw) {
  // Strip markdown code fences if model wrapped the JSON
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('La respuesta no contiene JSON válido. El modelo puede no soportar este formato de salida.');
  return JSON.parse(match[0]);
}

// ─── PROVIDERS ──────────────────────────────
export async function callClaude(conv, cats, ctx) {
  const key = document.getElementById('key-claude').value.trim();
  if (!key) throw new Error('API key de Anthropic requerida.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      system: buildSystemPrompt(cats, ctx),
      messages: [{ role: 'user', content: 'Analiza esta conversación y genera las notas:\n\n' + conv }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error ${res.status}`);
  }
  const data = await res.json();
  return data.content[0].text.trim();
}

export async function callGemini(conv, cats, ctx) {
  const key = document.getElementById('key-gemini').value.trim();
  if (!key) throw new Error('API key de Google Gemini requerida.');

  const prompt = buildSystemPrompt(cats, ctx) + '\n\nConversación a analizar:\n\n' + conv;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8000 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

export async function callOpenAI(conv, cats, ctx) {
  const key   = document.getElementById('key-openai').value.trim();
  const model = document.getElementById('model-openai').value;
  if (!key) throw new Error('API key de OpenAI requerida.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: buildSystemPrompt(cats, ctx) },
        { role: 'user', content: 'Analiza esta conversación y genera las notas:\n\n' + conv },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function callOllama(conv, cats, ctx) {
  const host  = document.getElementById('host-ollama').value.trim().replace(/\/$/, '');
  const model = document.getElementById('model-ollama').value.trim();
  if (!model) throw new Error('Especifica el modelo de Ollama.');

  const prompt = buildSystemPrompt(cats, ctx) + '\n\nConversación a analizar:\n\n' + conv;

  const res = await fetch(host + '/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.3, num_predict: 8000 } }),
  });

  if (!res.ok) throw new Error(`No se pudo conectar a Ollama en ${host}. ¿Está corriendo?`);
  const data = await res.json();
  return (data.response || '').trim();
}

// ─── DOWNLOAD HELPERS ───────────────────────
export async function buildZip(notes) {
  const zip = new JSZip();
  notes.forEach(n => zip.folder(n.category || 'general').file(n.filename, n.content));
  return zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}
