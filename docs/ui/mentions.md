# Mentions (@file) Feature

## Overview

The mentions feature allows users to reference files in the workspace by typing `@` followed by a file path. This creates an inline chip that represents the file reference. The feature is implemented with full integration with the FilesService for real-time file indexing and search.

## Trigger

- Type `@` at start of line or after whitespace inside the composer
- A popup lists files from the workspace (via FilesService bridge)
- Type `@ ` (space after @) to show top-level items

## Selection

- Clicking or pressing Enter on a file in the popup creates a chip like `📄 src/ui/chat-webview.ts` inline
- The chip includes a visual icon, the file basename, and a close button
- Navigation through suggestions using arrow keys

## Removal

- Backspace immediately after a chip deletes it
- Clicking the × button on the chip removes it

## Payload

- The webview send event includes `embeddedFiles: string[]` (workspace-relative paths)
- No file contents are loaded in Stage 1. The extension forwards paths as-is to the agent via `options.embeddedFiles`

## Integration

- Controller mounted locally by composer via `[data-mentions]` container and `[data-composer-input]` editor
- CSS loaded via `media/chat/styles/mentions.css`
- Full integration with FilesService via bridge for real-time file search and indexing
- Drag and drop support from VS Code Explorer

## Implementation Details

The mentions feature is implemented in the `FileMentionsController` class located in `src/modules/mentions/index.ts`. This controller:

1. **Mounts to the composer** - Attaches to a container with `[data-mentions]` and an editor with `[data-composer-input]`
2. **Handles keyboard events** - Listens for `@` key presses and navigation within the popup
3. **Manages the popup UI** - Creates and updates a popup with file suggestions
4. **Handles file selection** - Creates chips when files are selected
5. **Manages chip removal** - Handles backspace and click removal of chips
6. **Collects embedded files** - Provides a method to collect all embedded file paths
7. **Supports drag and drop** - Allows dropping files from the VS Code Explorer
8. **Integrates with FilesService** - Uses bridge for real-time file search and indexing

## Files

- `src/modules/mentions/index.ts` — UI controller implementation
- `src/modules/composer/composer-dom.ts` — Composer DOM implementation that mounts mentions and exposes `getEmbeddedFiles()`
- `src/ui/composer-bootstrap.ts` — Sends `embeddedFiles` in `chat.userMessage` payload
- `src/ui/chat-webview.ts` and `src/ui/chat-view-provider.ts` — Forwards `embeddedFiles` to Core via `Events.UiSend` options
- `media/chat/styles/mentions.css` — CSS styles for the mentions UI

## Features

### Keyboard Navigation
- `@` key triggers the mentions popup
- Arrow keys navigate through suggestions
- Enter/Tab selects the highlighted item
- Escape closes the popup

### Smart Filtering
- Real-time search through workspace files via FilesService
- Results sorted with directories first, then files
- Parent directories of matched files included in results

### Drag and Drop
- Files can be dragged from VS Code Explorer directly into the composer
- Automatically resolves dropped file paths into mentions

### Backspace Handling
- Backspace immediately after a chip deletes the entire chip
- Normal backspace behavior within text

### Click Outside
- Clicking outside the composer area closes the mentions popup

## Bridge Integration

The mentions controller communicates with the extension through the bridge:

1. **files/index**: Request a slice of indexed files
2. **files/search**: Search for files matching a query
3. **files/listChildren**: List children of a directory
4. **files/stat**: Get metadata for a specific file
5. **files/resolveDrop**: Resolve dropped file paths

Responses are received via **files/result** messages with operation-specific data.

## Folders First Behavior

- Results are always sorted with directories first, then files (alphabetical by basename)
- Parent directories of matched files are included in search results
- Defensive sorting ensures folders remain first even if provider doesn't sort correctly

## Troubleshooting

- Verify the bridge is active: open the Webview Developer Tools and look for logs like `mentions: bridge available = true` and `mentions: bridge result`
- If you see `mentions: no bridge, using local fallback`, check that `dist/ui/bridge.js` is injected and that `window.CodexBridge` exists before the composer mounts
- When typing `@` (or `@ `), you should see top-level folders first. With any query (e.g., `@comp`), parent folders of matched files are still included
- Check that FilesService is properly initialized in CoreManager