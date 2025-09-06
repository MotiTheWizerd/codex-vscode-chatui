# html-builder.ts

Builds the full HTML for the chat webview with styles, scripts and HTML fragments.

- API: `buildChatHtml(context, webview, logger?) => Promise<string>`
- Responsibilities:
  - Discover `media/chat/**/*.css/js` and `dist/ui/*.js`
  - Generate versioned URIs and script/link tags
  - Load and inject fragments from `media/chat/html/{head,header,messages,footer}`
  - Apply CSP source and a random nonce
  - Return the final HTML string

Example:

```ts
import { buildChatHtml } from "@/ui/chat-webview-utilities/html-builder";

panel.webview.html = await buildChatHtml(context, panel.webview, logger);
```

