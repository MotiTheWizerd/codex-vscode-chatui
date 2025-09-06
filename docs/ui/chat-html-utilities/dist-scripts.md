# dist-scripts.ts

Detects compiled webview scripts in `dist/ui` and renders module script tags in a fixed order.

API
- `resolveDistScripts(context, webview): Promise<string[]>` — returns webview URLs with `?v=<mtime>`
- `renderDistScriptTags(urls, nonce): string`

Order (preserved)
1. bridge.js
2. elements-registry.js
3. controllers.js
4. renderer.js
5. bootstrap.js
6. composer-bootstrap.js

Behavior
- Skips missing files; keeps relative order for those present.
- Renders `<script type="module" nonce="..." src="..."></script>`.

