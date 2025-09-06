# message-router.ts

Routes incoming messages from the webview to core services.

- API: `createMessageHandler(core, panel, logger?) => (msg) => Promise<void>`
- Handles:
  - `ui.ready` → posts init payload with session snapshot, features, config
  - `chat.userMessage` → publishes `Events.UiSend` with text and options
  - `files/*` → bridges to FilesService (`index`, `search`, `listChildren`, `stat`, `resolveDrop`)

Example:

```ts
const handler = createMessageHandler(core, panel, logger);
const recv = panel.webview.onDidReceiveMessage(handler);
disposables.push(recv);
```

