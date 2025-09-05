# UI Composer Bootstrap

## Overview

`dist/ui/composer-bootstrap.js` mounts the framework‑free DOM Composer into the webview footer at `#composer-root` and wires message flow to the extension host. It listens to composer events (change/submit) and posts messages back to the extension.

## Mounting

- Host element: `<div id="composer-root" class="composer-root" data-role="composer"></div>` in `media/chat/html/footer`.
- Initializes via `initComposer(root, options)` from `@/modules/composer` (path alias).
- Listens for composer events and posts `chat.userMessage` with `{ text, attachments, embeddedFiles }` to the extension.

## Bridge Messages

- Outbound: `chat.userMessage` — sent when user submits (Ctrl/Cmd+Enter or Send button).
- Inbound: `ui.focusInput`, `ui.setInput`, `ui.insertText` — focus and programmatic value updates.

## Assets

- CSS: `media/chat/styles/composer.css` is loaded with other chat styles; no CSS is imported from JS.
- Scripts: Loaded as a module script by `chat-webview.ts`; the Composer module graph is imported from there.

## Notes

- The legacy textarea-based `ComposerController` remains for backward compatibility but is not mounted.
- Paste handling inserts sanitized HTML at the caret using Selection/Range APIs; image pastes are captured as attachments with previews.
- The `bootstrap.js` file handles Renderer orchestration and `ui.ready`. Composer bootstrap is independent.
