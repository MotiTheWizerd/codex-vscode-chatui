# Composer Module - bridge.ts

## Overview

The `bridge.ts` file provides the integration between the composer module and the VS Code webview API. It handles the communication between the webview and the extension host, allowing messages to be sent and received.

## Implementation

```ts
// src/modules/composer/bridge.ts
// Example wiring for a VS Code webview page using the composer

import { initComposer } from "./index";

// VS Code webview API
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const vscode = acquireVsCodeApi?.();

export function attachComposer() {
  const el = document.getElementById("composer");
  if (!el) throw new Error("#composer host not found");

  const composer = initComposer(el, { placeholder: "Message…" });

  composer.on((e) => {
    if (e.type === "submit") {
      vscode?.postMessage?.({ type: "user.send", text: e.value });
    }
  });

  window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (!msg) return;
    if (msg.type === "ui.setInput") composer.setValue(msg.text ?? "");
    if (msg.type === "ui.focusInput") composer.focus();
    if (msg.type === "ui.insertText") composer.setValue(composer.getValue() + (msg.text ?? ""));
  });

  return composer;
}
```

## Functions

### attachComposer()

Initializes and attaches the composer to the webview:

1. Finds the composer host element in the DOM
2. Initializes the composer with default options
3. Sets up event listeners for:
   - Composer submit events (sends messages to the extension)
   - Window message events (receives messages from the extension)
4. Returns the composer instance

## Message Handling

### Outgoing Messages (to extension)
- When the user submits a message, it sends a `{ type: "user.send", text }` message to the extension

### Incoming Messages (from extension)
- `ui.setInput` - Sets the composer value
- `ui.focusInput` - Focuses the composer input
- `ui.insertText` - Inserts text at the current cursor position

## Design Principles

1. **Integration**: Seamlessly connects the composer to the VS Code webview API
2. **Message Passing**: Implements bidirectional communication between webview and extension
3. **Error Handling**: Gracefully handles missing elements or APIs
4. **Extensibility**: Easy to add new message types or modify existing ones