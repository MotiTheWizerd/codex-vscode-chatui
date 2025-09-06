# Chat HTML Utilities

Purpose: small, isolated helpers used by `src/ui/chatHtml.ts` to assemble the webview HTML safely and predictably.

Modules
- security.ts: Nonce generation and HTML escaping
- fragments.ts: HTML fragment discovery, validation, and concatenation
- assets.ts: Collects CSS/JS under `media/chat` and renders tags
- dist-scripts.ts: Detects compiled `dist/ui/*.js` and renders module script tags
- template.ts: Loads `index.html`, applies CSP fixes, injects placeholders
- types.ts: Shared interfaces (`FragmentResult`)

Import aliases
- `@/ui/chat-html-utilities/*`

Guarantees
- No behavior change from previous inlined logic
- Preserves dist script order and fragment filtering
- Uses `webview.asWebviewUri` + `?v=<mtime>` cache busting

Verification Checklist
- Open the Chat webview and check for no CSP errors in DevTools console.
- Verify styles/scripts counts in logs: look for `chat-html: scripts` with `dist`, `classic`, and `styles` values that match files present under `media/chat` and `dist/ui`.
- Check dist script load order via Network tab: bridge → elements-registry → controllers → renderer → bootstrap → composer-bootstrap.
- Confirm fragment injection: modify/add files under `media/chat/html/{head,header,messages,footer}` and ensure they appear in the right sections.
- Fragment rejection path: add a `<script>` tag to a fragment and ensure it is skipped, a warning is logged, and an in-UI banner appears above messages/footer.
- Placeholder resolution: view page source and confirm no raw `{{...}}` tokens remain; `{{STYLES}}` and `{{SCRIPTS}}` expand to tags.
- Cache busting: touch a CSS/JS file and confirm loaded URLs include updated `?v=<mtime>` query parameters.
- Optional dirs: temporarily remove/rename `styles/` or `js/` under `media/chat` and verify no crashes; counts decrease as expected.
