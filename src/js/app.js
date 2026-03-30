import { callClaude, callGemini, callOpenAI, callOllama, parseResponse, buildZip, triggerDownload } from './api.js';

// ─── STATE ───────────────────────────────────
let notes = [];
let busy  = false;
let currentProvider = 'claude';

// ─── DOM REFS ────────────────────────────────
const convEl     = document.getElementById('conv');
const progEl     = document.getElementById('prog');
const progBar    = document.getElementById('prog-bar');
const progLabel  = document.getElementById('prog-label');
const statusMsg  = document.getElementById('status-msg');
const runBtn     = document.getElementById('run-btn');
const dlAll      = document.getElementById('dl-all');
const dlSingle   = document.getElementById('dl-single');
const copyAllBtn = document.getElementById('copy-all');
const dotOut     = document.getElementById('dot-out');
const dotIn      = document.getElementById('dot-in');
const outputEl   = document.getElementById('output');
const notesCount = document.getElementById('notes-count');
const provLabel  = document.getElementById('provider-label');

// ─── HELPERS ─────────────────────────────────
function setProg(pct, label = '') {
  progEl.style.width = pct + '%';
  progBar.setAttribute('aria-valuenow', pct);
  progLabel.textContent = label;
}

function setStatus(msg, dotState) {
  statusMsg.textContent = msg.toUpperCase();
  if (dotState !== undefined) dotOut.className = 'status-dot ' + dotState;
}

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setOutputButtons(enabled) {
  dlAll.disabled      = !enabled;
  dlSingle.disabled   = !enabled;
  copyAllBtn.disabled = !enabled;
}

// ─── PROVIDER SELECTOR ───────────────────────
window.selectProvider = function(p) {
  currentProvider = p;
  document.querySelectorAll('.ptab').forEach(t => {
    const isActive = t.dataset.provider === p;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive);
  });
  ['claude', 'gemini', 'openai', 'ollama'].forEach(id => {
    const el = document.getElementById('cfg-' + id);
    if (el) el.hidden = id !== p;
  });
  provLabel.textContent = p.toUpperCase();
};

// ─── CATEGORIES ──────────────────────────────
window.addCat = function() {
  const input = document.getElementById('new-cat');
  const v = input.value.trim().replace(/\s+/g, '-').toLowerCase();
  if (!v) return;

  const pill = document.createElement('button');
  pill.className   = 'pill on';
  pill.dataset.val = v;
  pill.textContent = v;
  pill.addEventListener('click', () => pill.classList.toggle('on'));

  document.getElementById('pills').appendChild(pill);
  input.value = '';
  input.focus();
};

function getCategories() {
  return Array.from(document.querySelectorAll('.pill.on')).map(p => p.dataset.val);
}

// ─── RENDER ──────────────────────────────────
function renderNotes(noteList, summary) {
  outputEl.innerHTML = '';

  if (summary) {
    const s = document.createElement('div');
    s.className = 'summary-card';
    s.textContent = summary;
    outputEl.appendChild(s);
  }

  noteList.forEach((note, i) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    const preview = note.content.slice(0, 400) + (note.content.length > 400 ? '\n...' : '');

    card.innerHTML = `
      <div class="nc-head">
        <span class="nc-path">${esc(note.category || 'general')}/${esc(note.filename)}</span>
        ${(note.tags || []).slice(0, 3).map(t => `<span class="nc-tag">#${esc(t)}</span>`).join('')}
      </div>
      <div class="nc-body">${esc(preview)}</div>
      <div class="nc-foot">
        <button class="btn btn--ghost btn--sm" data-action="copy" data-idx="${i}" aria-label="Copiar nota ${i + 1}">COPIAR MD</button>
        <button class="btn btn--ghost btn--sm" data-action="dl" data-idx="${i}" aria-label="Descargar nota ${i + 1}">↓ .MD</button>
      </div>
    `;
    outputEl.appendChild(card);
  });

  // Event delegation — avoids inline handlers
  outputEl.addEventListener('click', handleOutputClick);
}

function handleOutputClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const i = parseInt(btn.dataset.idx, 10);
  if (btn.dataset.action === 'copy') copyNote(i, btn);
  if (btn.dataset.action === 'dl')   downloadNote(i);
}

// ─── NOTE ACTIONS ────────────────────────────
function copyNote(i, btn) {
  navigator.clipboard.writeText(notes[i].content).then(() => {
    const original = btn.textContent;
    btn.textContent = '✓ COPIADO';
    setTimeout(() => { btn.textContent = original; }, 2000);
  }).catch(() => {
    btn.textContent = 'ERROR';
    setTimeout(() => { btn.textContent = 'COPIAR MD'; }, 2000);
  });
}

function downloadNote(i) {
  const blob = new Blob([notes[i].content], { type: 'text/markdown' });
  triggerDownload(blob, notes[i].filename);
}

window.copyAllNotes = function() {
  if (!notes.length) return;
  const combined = notes.map(n => n.content).join('\n\n---\n\n');
  navigator.clipboard.writeText(combined).then(() => {
    const original = copyAllBtn.textContent;
    copyAllBtn.textContent = '✓ TODO COPIADO';
    setTimeout(() => { copyAllBtn.textContent = original; }, 2000);
  });
};

window.downloadAll = async function() {
  if (!notes.length) return;
  const blob = await buildZip(notes);
  triggerDownload(blob, 'synapsemd-' + new Date().toISOString().slice(0, 10) + '.zip');
};

window.downloadSingleMD = function() {
  if (!notes.length) return;
  const combined = notes.map(n => `<!-- === ${n.category}/${n.filename} === -->\n\n${n.content}`).join('\n\n---\n\n');
  const blob = new Blob([combined], { type: 'text/markdown' });
  triggerDownload(blob, 'synapsemd-' + new Date().toISOString().slice(0, 10) + '.md');
};

// ─── CLEAR ───────────────────────────────────
window.clearAll = function() {
  convEl.value = '';
  document.getElementById('charcount').textContent = '0 chars';
  dotIn.className  = 'status-dot';
  dotOut.className = 'status-dot';
  notes = [];
  outputEl.innerHTML = `
    <div class="empty-state" id="empty-state">
      <div class="empty-glyph" aria-hidden="true">{ }</div>
      <p>Las notas generadas aparecerán aquí en formato Markdown estándar, compatibles con Obsidian, Notion, Logseq, Bear o cualquier editor MD.</p>
    </div>`;
  notesCount.textContent = '0 NOTAS';
  setOutputButtons(false);
  setStatus('esperando input');
  setProg(0);
};

// ─── MAIN RUN ────────────────────────────────
window.run = async function() {
  const conv = convEl.value.trim();
  if (!conv) { alert('Pega una conversación primero.'); return; }
  if (busy)  return;

  busy = true;
  notes = [];
  runBtn.disabled = true;
  setOutputButtons(false);
  dotOut.className = 'status-dot busy';
  outputEl.innerHTML = '';
  notesCount.textContent = '0 NOTAS';
  provLabel.textContent  = currentProvider.toUpperCase();

  const cats = getCategories();
  const ctx  = document.getElementById('ctx').value.trim();

  setStatus('conectando con ' + currentProvider + '...', 'busy');
  setProg(15, 'enviando...');

  try {
    setProg(30, 'procesando...');

    let raw;
    if      (currentProvider === 'claude')  raw = await callClaude(conv, cats, ctx);
    else if (currentProvider === 'gemini')  raw = await callGemini(conv, cats, ctx);
    else if (currentProvider === 'openai')  raw = await callOpenAI(conv, cats, ctx);
    else                                     raw = await callOllama(conv, cats, ctx);

    setProg(75, 'parseando...');
    const parsed = parseResponse(raw);
    notes = parsed.notes || [];

    setProg(90, 'renderizando...');
    renderNotes(notes, parsed.summary);

    const n = notes.length;
    notesCount.textContent = n + (n === 1 ? ' NOTA' : ' NOTAS');
    setOutputButtons(true);
    dotOut.className = 'status-dot ready';
    setStatus(`${n} notas generadas con ${currentProvider}`, 'ready');
    setProg(100, 'listo ✓');

  } catch (err) {
    dotOut.className = 'status-dot err';
    setStatus('error: ' + err.message, 'err');
    setProg(0, '');

    const el = document.createElement('div');
    el.className = 'err-card';
    el.textContent = '✕ ' + err.message;
    outputEl.appendChild(el);
  } finally {
    busy = false;
    runBtn.disabled = false;
  }
};

// ─── INIT ────────────────────────────────────
convEl.addEventListener('input', () => {
  const n = convEl.value.length;
  document.getElementById('charcount').textContent = n.toLocaleString() + ' chars';
  dotIn.className = 'status-dot ' + (n > 10 ? 'ready' : '');
});

document.querySelectorAll('.pill').forEach(p => {
  p.addEventListener('click', () => p.classList.toggle('on'));
});

selectProvider('claude');
