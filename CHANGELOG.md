# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-03-30

### Added
- Multi-provider support: Claude (claude-3-5-sonnet), Gemini (gemini-1.5-flash), ChatGPT (gpt-4o family), and Ollama (local models)
- Structured Markdown output with YAML frontmatter (title, tags, category, date)
- Customizable output categories with pill selectors (add/remove dynamically)
- Optional user context field to improve note quality
- ZIP export: all notes organized in per-category folders
- Single `.md` export: all notes combined in one file with separators
- Clipboard copy: per-note and "Copy All" for the full batch
- Character counter and real-time status indicators on both panels
- Neo-Brutalist UI with Syne (display) and Space Grotesk (UI) fonts
- Modular codebase: `app.js` (UI) + `api.js` (providers) + `main.css` (design)
- Vite-based build pipeline with npm scripts (`dev`, `build`, `preview`)
- Accessible HTML: ARIA labels, screen-reader only classes, `role="tab"` navigation
- `.gitignore` covering `node_modules/`, `dist/`, `.env`, `.DS_Store`, logs
- `README.md` with full usage guide

### Changed
- Migrated from single monolithic `index.html` to modular `src/` structure
- Replaced CDN-loaded Lucide with inline SVGs to eliminate render-blocking
- Replaced CDN JSZip with npm-managed dependency
- Removed `console.log` left in production code
- Applied event delegation pattern — removed all inline `onclick=` handlers from HTML

### Fixed
- `copyNote()` button selector was off-by-one when multiple notes were rendered
- `downloadAll()`/`downloadSingleMD()` now properly revoke object URLs after download
- Provider config panels now use the `hidden` attribute instead of `style="display:none"` for better accessibility
- Error messages now surface the actual API response body, not generic labels

### Security
- No API keys are logged or stored anywhere; all state is in-memory only
- `innerHTML` rendering now uses `esc()` helper on all user-supplied or AI-returned strings

---

## [Unreleased]

- Light mode toggle
- Conversation history / session restore from localStorage
- Per-note editing before export
- Preset context profiles
