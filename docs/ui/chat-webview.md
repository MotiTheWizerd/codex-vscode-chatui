# Chat Webview Module

## Overview

The chat webview module provides the user interface for Codex chat as a dedicated `WebviewPanel`. It builds the panel HTML from a template and dynamically loads styles, scripts, and HTML fragments. The module handles asset loading, CSP security, and development-time auto-refresh.

## Implementation Status

Implemented and used as the sole UI for chat.

## Key Files

- `src/ui/chat-webview.ts` — Creates the `WebviewPanel`, assembles HTML, wires CSP, and watches assets.
- `src/ui/chat-panel-manager.ts` — Manages a single open instance and reveal behavior.
- `media/chat/index.html` — HTML template with placeholders for assets and fragments.
- `media/chat/styles/*.css` — Stylesheets included in alphabetical order.
- `media/chat/js/*.js` — Scripts included in alphabetical order with CSP nonce (excluding bridge/renderer, now compiled from TS).
- `dist/ui/bridge.js`, `dist/ui/renderer.js` — Compiled TS scripts injected first to expose `window.CodexBridge` and `window.Renderer`.
 - `dist/ui/elements-registry.js`, `dist/ui/controllers.js` — Compiled TS scripts for registry and controllers.
 - `dist/ui/bootstrap.js` — Compiled TS bootstrap injected last among dist scripts (no globals), orchestrates startup.
- `media/chat/html/{head,header,messages,footer}/**/*.html` — Safe fragments injected into the template.

## Behavior

- Loads assets via `webview.asWebviewUri` and appends `?v=<mtime>` for cache busting.
- Validates HTML fragments (no `<script>` or CSP meta tags) and injects warnings if any are rejected.
- Watches `media/chat/**/*.{css,js}` and `media/chat/html/**/*.html` during development to refresh the panel.
- Uses a factory pattern for instantiation with proper disposal handling.
- UI bootstrap: `dist/ui/bootstrap.js` waits for globals, constructs a `Renderer`, calls `mountAll(document)`, posts `ui.ready`, and forwards extension messages to `renderer.handle()`.
 - Send/Stream: UI sends `chat.userMessage` → ChatWebview publishes `Events.UiSend` → CoreManager routes to transport; tokens and completion are forwarded back to the webview as `assistant.token` and `assistant.commit`.

## Key Features

- **CSP Security**: Nonce-bound external scripts and proper CSP configuration
- **Asset Management**: Automatic loading and injection of CSS, JS, and HTML fragments
- **Development Experience**: Auto-refresh when assets change during development
- **Error Handling**: Graceful fallback when HTML template fails to load
- **Resource Cleanup**: Proper disposal of watchers and event listeners
- **Element Registry**: `Renderer` owns registration; `ElementsRegistry` mounts/updates/disposes controllers
- **Static Folder**: `media/chat/js` contains no runtime logic; all webview logic lives in TypeScript modules compiled to `dist/ui`.

## Design Principles

1. **User Experience**: Accessible, responsive chat UI with proper error handling
2. **Integration**: Follows VS Code Webview best practices and CSP security model
3. **Performance**: Batches rebuild with debounce and sorted asset loading
4. **Maintainability**: Clear separation of concerns with factory pattern for instantiation
5. **Security**: Validates HTML fragments to prevent script injection
6. **Developer Experience**: Auto-refresh during development for rapid iteration
7. **Single DOM Truth**: `[data-el]` anchors with idempotent mounts; classes for styling only
