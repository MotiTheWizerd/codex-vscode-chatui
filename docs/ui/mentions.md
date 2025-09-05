# Mentions (@file) — Stage 1 (UI + Mock)

## Overview

The mentions feature allows users to reference files in the workspace by typing `@` followed by a file path. This creates an inline chip that represents the file reference. In Stage 1, this is implemented as a UI-only feature with mock data.

## Trigger

- Type `@` at start of line or after whitespace inside the composer
- A popup lists files from the workspace (or mock files in Stage 1)

## Selection

- Clicking or pressing Enter on a file in the popup creates a chip like `📄 src/ui/chat-webview.ts` inline
- The chip includes a visual icon, the file basename, and a close button

## Removal

- Backspace immediately after a chip deletes it
- Clicking the × button on the chip removes it

## Payload

- The webview send event includes `embeddedFiles: string[]` (workspace-relative paths)
- No file contents are loaded in Stage 1. The extension forwards paths as-is to the agent via `options.embeddedFiles`

## Integration

- Controller mounted locally by composer (no global registry needed in Stage 1)
- CSS loaded via `media/chat/styles/mentions.css` (the webview asset loader already picks up styles/)

## Implementation Details

The mentions feature is implemented in the `FileMentionsController` class located in `src/modules/mentions/index.ts`. This controller:

1. **Mounts to the composer** - Attaches to a container with `[data-mentions]` and an editor with `[data-composer-input]`
2. **Handles keyboard events** - Listens for `@` key presses and navigation within the popup
3. **Manages the popup UI** - Creates and updates a popup with file suggestions
4. **Handles file selection** - Creates chips when files are selected
5. **Manages chip removal** - Handles backspace and click removal of chips
6. **Collects embedded files** - Provides a method to collect all embedded file paths
7. **Supports drag and drop** - Allows dropping files from the VS Code Explorer

## Files

- `src/modules/mentions/index.ts` — UI controller implementation
- `src/modules/composer/composer-dom.ts` — Composer DOM implementation that mounts mentions and exposes `getEmbeddedFiles()`
- `src/ui/composer-bootstrap.ts` — Sends `embeddedFiles` in `chat.userMessage` payload
- `src/ui/chat-webview.ts` — Forwards `embeddedFiles` to Core via `Events.UiSend` options
- `media/chat/styles/mentions.css` — CSS styles for the mentions UI

## Stage 1 Limitations

- Uses deterministic mock data instead of actual workspace files
- No file content loading or processing
- Basic file search functionality