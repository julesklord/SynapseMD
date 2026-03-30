# SynapseMD

> **Conversational Intelligence Scribe** — Converts AI conversations into structured Markdown notes.

[![Version](https://img.shields.io/badge/version-1.0.0-blueviolet?style=flat-square)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![Providers](https://img.shields.io/badge/providers-Claude%20%7C%20Gemini%20%7C%20ChatGPT%20%7C%20Ollama-orange?style=flat-square)]()

---

## What is SynapseMD?

SynapseMD transforms raw AI conversations into high-quality, structured Markdown notes — ready to drop into Obsidian, Notion, Logseq, Bear, or any Markdown-compatible tool.

Paste a conversation, select your output categories, click **Generar Notas**, and get clean, frontmatter-tagged `.md` files organized by topic.

## Features

- 🧠 **Multi-provider**: Works with Claude, Gemini, ChatGPT, and local Ollama models
- 📁 **Organized output**: Notes automatically sorted into categories
- 🏷️ **YAML frontmatter**: Full metadata (title, tags, category, date) for every note
- 📦 **Export options**: Download as ZIP (one file per note) or a single combined `.md`
- 📋 **Clipboard-ready**: Copy individual notes or everything at once
- 🔒 **Zero server**: All API calls happen client-side — your keys never leave your browser

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (for development)
- An API key for at least one provider (Claude, Gemini, OpenAI), or a running [Ollama](https://ollama.ai/) instance

### Development

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in dist/
```

### Quick Start (No Build)

Open `src/index.html` directly in a browser. No build step required for basic use.

## Usage

1. Select your **AI provider** and enter your API key in the top bar
2. Configure your **output categories** (add custom ones as needed)
3. Optionally add **context** about yourself or your project
4. Paste the full conversation in the **left panel**
5. Click **Generar Notas**
6. Review notes in the **right panel** and export via ZIP, single `.md`, or clipboard

## Supported Providers

| Provider | Model | Notes |
|---|---|---|
| **Claude** | `claude-3-5-sonnet-20240620` | Best output quality |
| **Gemini** | `gemini-1.5-flash` | Fast & free tier available |
| **ChatGPT** | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` | Selectable in UI |
| **Ollama** | Any local model | Requires running Ollama server |

## Project Structure

```
src/
  index.html          # Entry point (semantic, accessible HTML)
  styles/
    main.css          # Neo-Brutalist design system
  js/
    app.js            # UI logic and state management
    api.js            # Provider API calls and helpers
```

## Browser Compatibility

Requires a modern browser with support for:
- ES Modules (`type="module"`)
- `navigator.clipboard` (HTTPS or localhost required for copy features)
- CSS `backdrop-filter` (gracefully degraded)

## Contributing

PRs welcome. Please open an issue first for major changes.

## License

MIT © [julesklord](https://github.com/julesklord)
