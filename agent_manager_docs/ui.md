# UI: Chat Panel (WebviewPanel Only)

Status: Implemented (sole UI)

- Type: `WebviewPanel` (dedicated panel, not a sidebar view)
- Entry command: `codex.openChatPanel`
- Activation: `onCommand:codex.openChatPanel`

## No Activity Bar/Sidebar

- No Activity Bar view container is contributed.
- No sidebar `WebviewView` is registered.
- The previous Activity Bar button and launcher view have been removed.
- No Status Bar "Sidebar" toggle; `codex.toggleSidebar` command removed.

## Behavior

- Opens a single Chat panel (subsequent invokes focus the existing panel).
- Loads assets from `media/chat/` including styles, scripts, and HTML fragments.
- Watches assets during development to auto-refresh the panel content.

## Implementation

- Panel class: `src/ui/chat-webview.ts`
- Panel manager: `src/ui/chat-panel-manager.ts` (singleton panel lifecycle)
- Activation wiring: `src/ext/extension.ts` registers the `codex.openChatPanel` command and calls `ChatPanelManager.open(...)`.

## Security & CSP

- Nonce-bound external scripts; CSP sourced via `webview.asWebviewUri`.
- `localResourceRoots`: `<extensionUri>/media`.

## Dependencies

- VS Code `WebviewPanel` API
- Core services via `@/core/manager` and logging via `@/telemetry/logger`

## Example

Command Palette → “Codex: Open Chat” (runs `codex.openChatPanel`).

## Status Bar Menu

- Status item: `$(rocket) Codex` (right side)
- Command: `codex.showMenu`
- Quick Pick items:
  - `$(comment-discussion) Open Codex Chat` → runs `codex.openChatPanel`
  - `$(output) Open Codex Logs` → shows output channel
