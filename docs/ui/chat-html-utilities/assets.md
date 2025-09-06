# assets.ts

Collects static CSS/JS from `media/chat` and renders HTML tags with stable ordering.

API
- `collectStaticAssets(chatDir, webview, nonce): Promise<{ styleTags, classicScriptTags, styleCount, classicCount }>`

Behavior
- Reads root `*.css` and `*.js` under `media/chat`.
- Optionally reads `media/chat/styles/*.css` and `media/chat/js/*.js`.
- Sorts by path, maps to `webview.asWebviewUri` and appends `?v=<mtime>` for cache busting.
- Renders:
  - `<link rel="stylesheet" href="...">`
  - `<script nonce="..." src="..."></script>` (classic scripts)

