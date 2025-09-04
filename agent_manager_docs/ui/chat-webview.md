# Chat Webview

- Purpose: Host the Codex Chat UI in a `WebviewPanel` with dynamic asset loading and strict CSP.

## Asset Loading

- Source dir: `media/chat`
- Template: `media/chat/index.html` is the ONLY full document and contains placeholders `{{STYLES}}`, `{{SCRIPTS}}`, `{{NONCE}}`, `{{CSP_SOURCE}}`, plus fragment anchors `{{HEAD_PARTS}}` and `{{BODY_PARTS}}`.
- Folders:
  - CSS: place styles in `media/chat/styles/`
  - JS: place scripts in `media/chat/js/`
  - The loader also includes any `.css`/`.js` files at `media/chat/` root.
- Ordering: alphabetical. Use numeric prefixes (e.g., `00_boot.js`, `10_main.js`).
- Cache busting: query param `?v=<mtime>` added to each asset.

## Implementation

- Entry: `src/ui/chat-webview.ts` method `setHtml()`
- Steps:
  - Read directory contents of `media/chat`, plus optional `styles/` and `js/` subfolders.
  - Filter to `.css` and `.js` files, sort alphabetically.
  - Convert to `webview.asWebviewUri()` and append `?v=mtime`.
  - Inject built `<link>` and `<script nonce="...">` tags into `index.html`.
  - Read HTML fragments from `media/chat/html/head/**/*.html` and `media/chat/html/body/**/*.html` (lexicographic order), validate (no `<script>` or CSP meta), and inject into `{{HEAD_PARTS}}` and `{{BODY_PARTS}}`.
  - If any fragment is rejected, log a warning and inject a small banner at the top of BODY.
  - Assign `webview.html` with CSP variables replaced.

## CSP

- `script-src 'nonce-{{NONCE}}'` — all scripts must be external and get a nonce.
- `style-src {{CSP_SOURCE}}` — no inline style tags; CSS does not need a nonce.
- `localResourceRoots` includes `<extensionUri>/media`.

## Auto-Refresh

- A `FileSystemWatcher` watches `media/chat/**/*.{css,js}` and `media/chat/html/**/*.html` with a short debounce to rebuild once.
  - If your project only updates fragments on extension release, this watcher is optional overhead; we keep it enabled during dev.

## Usage

- Open the chat panel via `ChatPanelManager.open(...)` or appropriate command.
- To add assets, drop files into `media/chat/styles/` or `media/chat/js/` and they will load automatically in alpha order.
 - To add UI, create files under `media/chat/html/head/` or `media/chat/html/body/` (snippets only, no `<html>`/`<head>`/`<body>`).
 - Use numeric prefixes to control order (e.g., `01_...`, `10_...`, or `005_...`).
