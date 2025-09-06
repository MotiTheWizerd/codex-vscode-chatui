# Chat Webview Utilities

Utilities that keep `ChatWebview` thin and focused on lifecycle. These modules encapsulate HTML generation, message routing from the webview, and transport event bridging back to the UI.

## Files

- `html-builder.ts` — builds full HTML string (styles, scripts, fragments, CSP nonce)
- `fragment-utils.ts` — helpers for loading and validating HTML fragments
- `csp.ts` — nonce generator and future CSP helpers
- `message-router.ts` — routes `webview.onDidReceiveMessage` events to core services
- `transport-bridge.ts` — subscribes to transport events and posts to the webview

## Import Rules

Always use path aliases:

```ts
import { buildChatHtml } from "@/ui/chat-webview-utilities/html-builder";
import { createMessageHandler } from "@/ui/chat-webview-utilities/message-router";
import { attachTransportBridge } from "@/ui/chat-webview-utilities/transport-bridge";
```

## Example (inside ChatWebview)

```ts
const handler = createMessageHandler(core, panel, logger);
const recv = panel.webview.onDidReceiveMessage(handler);
disposables.push(recv);

const html = await buildChatHtml(context, panel.webview, logger);
panel.webview.html = html;

const bridge = attachTransportBridge(core.eventBusInstance, panel, core, logger);
disposables.push(bridge);
```

