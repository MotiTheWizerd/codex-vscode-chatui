# UI: Chat Panel (WebviewPanel Only)

Status: Implemented (sole UI)

- Type: `WebviewPanel` (dedicated panel, not a sidebar view)
- Entry command: `codex.openChatPanel`
- Activation: `onStartupFinished` and `onCommand:codex.openChatPanel`

## No Activity Bar/Sidebar

- No Activity Bar view container is contributed.
- No sidebar `WebviewView` is registered.
- The previous Activity Bar button and launcher view have been removed.
- No Status Bar "Sidebar" toggle; `codex.toggleSidebar` command removed.

## Behavior

- Opens a single Chat panel (subsequent invokes focus the existing panel).
- Loads assets from `media/chat/` including styles, scripts, and HTML fragments.
- Watches assets during development to auto-refresh the panel content.
- Uses CSP with nonce-bound scripts for security.

## Implementation

- Panel class: `src/ui/chat-webview.ts`
- HTML builder: `src/ui/chatHtml.ts` (orchestrates utilities)
- Utilities: `src/ui/chat-html-utilities/*` (assets, fragments, template, security, dist-scripts)
- Panel manager: `src/ui/chat-panel-manager.ts` (singleton panel lifecycle)
- Activation wiring: `src/core/bootstrap.ts` registers commands and creates status bar item
- Status bar menu: `src/ext/registrations/commands.ts` and `src/ui/statusbar/logs-button.ts`

## Security & CSP

- Nonce-bound external scripts; CSP sourced via `webview.asWebviewUri`.
- `localResourceRoots`: `<extensionUri>/media`.
- HTML fragment validation to prevent script injection.

## Dependencies

- VS Code `WebviewPanel` API
- Core services via `@/core/manager` and logging via `@/telemetry/logger`

## Commands

- `codex.openChatPanel` - Opens the chat panel
- `codex.showMenu` - Shows quick pick menu with options
- `codex.showLogs` - Opens the output channel

## Status Bar Menu

- Status item: `$(rocket) Codex` (right side)
- Command: `codex.showMenu`
- Quick Pick items:
  - `$(comment-discussion) Open Codex Chat` → runs `codex.openChatPanel`
  - `$(output) Open Codex Logs` → shows output channel

## Asset & Script Structure

Assets live under `media/chat/` and compiled scripts under `dist/ui/`:
- `media/chat/index.html` - Main HTML template
- `media/chat/styles/` - CSS stylesheets
- `media/chat/html/` - HTML fragments (head, header, messages, footer)
- `dist/ui/bridge.js` - Webview bridge (global `window.CodexBridge`)
- `dist/ui/elements-registry.js` - Registry (global `window.ElementsRegistry`)
- `dist/ui/controllers.js` - Controllers (global `window.MessageListController`, `window.ComposerController`)
- `dist/ui/renderer.js` - Renderer (global `window.Renderer`)
- `dist/ui/bootstrap.js` - Bootstrap logic (no globals)
- `dist/ui/composer-bootstrap.js` - Composer initialization (module entry)

## Development Workflow

- Assets are watched for changes during development
- Panel auto-refreshes when assets change
- Scripts from `dist/ui` are injected as module scripts with CSP nonce
- Error handling with fallback HTML when template fails to load
