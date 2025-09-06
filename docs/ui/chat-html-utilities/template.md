# template.ts

Loads the chat `index.html`, applies CSP fixes, and injects placeholder values.

API
- `loadTemplate(chatDir): Promise<string>`
- `applyCsp(html): string` — expands `script-src`/`style-src` to include `{{CSP_SOURCE}}` and `'nonce-{{NONCE}}'`
- `injectPlaceholders(html, map): string` — replaces `{{KEY}}` tokens

Placeholders
- `{{CSP_SOURCE}}` — `webview.cspSource`
- `{{NONCE}}` — nonce used in `<script>` tags
- `{{STYLES}}` — styles `<link>` tags
- `{{SCRIPTS}}` — scripts `<script>` tags
- `{{HEAD_PARTS}}`, `{{HEADER_PARTS}}`, `{{MESSAGE_PARTS}}`, `{{FOOTER_PARTS}}` — fragment HTML

