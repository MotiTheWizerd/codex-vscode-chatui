# transport-bridge.ts

Subscribes to transport events and forwards them to the webview.

- API: `attachTransportBridge(bus, panel, core, logger?) => vscode.Disposable`
- Emits to webview:
  - `assistant.token` for streamed tokens
  - `assistant.commit` on completion, using last assistant message content
  - Logs `transport error` via logger

Example:

```ts
const bridge = attachTransportBridge(core.eventBusInstance, panel, core, logger);
disposables.push(bridge);
```

