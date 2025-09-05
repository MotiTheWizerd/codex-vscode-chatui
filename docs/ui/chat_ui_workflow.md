# Chat UI Workflow

## Extension Initialization

File: `src/core/bootstrap.ts`
VS Code loads the extension when the activation event fires (onStartupFinished or onCommand:codex.openChatPanel).
CoreManager is constructed with the VS Code extension context and logger:
- Initializes ConfigService, PolicyGuard, EventBus, DIContainer
- Registers services in the DI container for global access
- Prepares telemetry (logger)

## Command Registration

File: `src/ext/registrations/commands.ts`
Registers commands in package.json:
- `codex.openChatPanel` - Opens the chat panel
- `codex.showMenu` - Shows a quick pick menu with options
- `codex.showLogs` - Opens the output channel

## Webview Creation

File: `src/ui/chat-webview.ts`
When `codex.openChatPanel` is executed:
1. ChatPanelManager checks if a panel already exists
2. If exists, reveals the existing panel
3. If not, creates a new ChatWebview instance which:
   - Creates a Webview Panel hosted in the right sidebar
   - Loads `media/chat/index.html` with external JS/CSS injected (nonce-based CSP enforced)
   - Sets up message passing between extension and webview
   - Watches assets for development-time auto-refresh

## Panel Structure

The chat panel includes:
- HTML template from `media/chat/index.html`
- CSS stylesheets from `media/chat/` and `media/chat/styles/`
- JavaScript files from `media/chat/` and `media/chat/js/`
 - JavaScript files from `media/chat/` and `media/chat/js/` (bootstrap + renderer + registry)
- HTML fragments from `media/chat/html/` subdirectories

## Message Communication

### Extension to Webview
- Uses `webview.postMessage()` to send messages to the webview
- Webview receives messages through a small `MessageBridge` wrapper
- Transport events are forwarded:
  - `assistant.token` for streaming tokens
  - `assistant.commit` for final assistant content

### Webview to Extension
- Uses `MessageBridge.post(type, payload)` (wraps `acquireVsCodeApi().postMessage()`)
- Extension receives messages through `webview.onDidReceiveMessage()` and publishes to EventBus

## Event Flow: Sending a Message

1. User types a message in the chat box (webview HTML/JS)
2. `MessageBridge.post('chat.userMessage', { text })` sends the message event to the extension
3. ChatWebview receives the message through `onDidReceiveMessage`
4. ChatWebview publishes `Events.UiSend` with `{ text, streaming }`
5. CoreManager handles policy checks, persistence, and transport
6. Core publishes `transport:*` events; ChatWebview forwards these to the webview

## Asset Management

File: `src/ui/chat-webview.ts`
- Loads CSS/JS assets from `media/chat/` with versioning (`?v=<mtime>`)
- Injects HTML fragments from `media/chat/html/` subdirectories
- Validates fragments to prevent script injection
- Watches asset files during development and auto-refreshes the panel
 - Anchors and actions use data attributes: `[data-el]`, `[data-action]`

## Session Persistence

File: `src/state/session-store.ts`
- Conversation history is saved to workspace storage
- Supports cache + eviction policy
- Restores chat history on reload/restart

## Telemetry & Error Handling

Files:
- `src/telemetry/logger.ts` – Structured logs to Output channel
- Error handling throughout components with proper logging
- Graceful degradation when components fail
