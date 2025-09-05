# Element Registry (Webview UI)

## Overview

The Element Registry is the single source of truth for UI islands inside the Chat webview. It registers controllers keyed by semantic names, mounts them against DOM anchors (`[data-el="..."]`), and proxies updates and disposal.

## Contracts

- Registry
  - `register({ key, selector, controller })`
  - `ensureMounted(key, doc?)` – idempotent
  - `update(key, patch)` – forwards to controller
  - `disposeAll()` – calls controller.dispose() in order

- Controller
  - `mount(root: HTMLElement)` – idempotent; attaches listeners within `root` only
  - `update(patch: any)` – re-render or patch the view
  - `dispose()` – remove listeners and release refs

## Bootstrap Lifecycle

1. `DOMContentLoaded`
2. `onLoad()` in `main.js`
3. `renderer.mountAll(document)` → mounts `messageList` and `composer`
4. `ui.ready` posted to extension via MessageBridge
5. Extension sends `init` → `renderer.handle({ type: 'session.restore', messages })`
6. First user sends → `chat.userMessage` (transport opens on first send)

## Selectors and Actions

- Anchors: `[data-el="message-list"]`, `[data-el="composer"]`
- Actions: `[data-action="send"]`, input: `[data-role="input"]`
- Classes remain for styling and have no behavioral meaning

## Event Handshake

- UI → Ext: `ui.ready`, `chat.userMessage`
- Ext → UI: `init`, `assistant.token`, `assistant.commit`

## Files

- `src/ui/bridge.ts` → compiles to `dist/ui/bridge.js` (MessageBridge globals)
- `src/ui/elements-registry.ts` → compiles to `dist/ui/elements-registry.js`
- `src/ui/controllers.ts` → compiles to `dist/ui/controllers.js` (MessageListController, ComposerController)
- `src/ui/renderer.ts` → compiles to `dist/ui/renderer.js` (Renderer globals)
- `media/chat/js/main.js` – Tiny bootstrap only

## Notes

- Idempotent mounts prevent duplicate listeners on refresh/reload.
- Schema version is included in `ui.ready` payload (`schemaVersion: 1`) to prevent silent drift.
- Error UX: Controllers should keep composer enabled; transport failures should surface as a small toast (future).
- The webview injects `dist/ui/bridge.js` and `dist/ui/renderer.js` before other scripts so `window.CodexBridge` and `window.Renderer` are available to `main.js`.
