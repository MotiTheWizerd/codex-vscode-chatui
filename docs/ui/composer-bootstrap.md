# UI Composer Bootstrap

## Overview

`dist/ui/composer-bootstrap.js` mounts the React-based Composer into the webview footer at `#composer-root` and wires message flow to the extension host.

## Mounting

- Host element: `<div id="composer-root" class="composer-root" data-role="composer"></div>` in `media/chat/html/footer`.
- Initializes via `initComposer(root, options)` from `@/modules/composer`.
- Listens for composer events and posts `chat.userMessage` with `{ text }` to the extension.

## Bridge Messages

- Outbound: `chat.userMessage` — sent when user submits (Ctrl+Enter or Send button).
- Inbound: `ui.focusInput`, `ui.setInput`, `ui.insertText` — focus and programmatic value updates.

## Assets

- CSS: `media/chat/styles/composer.css` is loaded with other chat styles; no CSS is imported from JS.
- Scripts: Loaded as a module script by `chat-webview.ts`; the Composer module graph is imported from there.

## Notes

- The legacy textarea-based `ComposerController` remains for backward compatibility but is not mounted.
- The `bootstrap.js` file handles Renderer orchestration and `ui.ready`. Composer bootstrap is independent.
