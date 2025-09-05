# Composer Module (Markdown‑first)

**Path:** `src/modules/composer/`

Lightweight chat composer for VS Code webviews.

- Plaintext Markdown model (diff‑friendly, safe)
- Toolbar: **B**, *I*, `code`, ``` fence ```, quote, list, Send
- Slash commands (optional): `/template`, `/attach`, etc.

## Usage

```ts
import { attachComposer } from "@/modules/composer/bridge"; // or relative path from your webview entry

// In your webview script after DOM ready
attachComposer();
```

**HTML host:**

```html
<div id="composer"></div>
```

**Events posted to extension:** `{ type: "user.send", text }`

## Notes

* Keep scripts/styles loaded with proper CSP (nonce, no inline eval).
* Extend via additional files in this folder (mentions.ts, attachments.ts) without touching other modules.