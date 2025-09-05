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
- `media/chat/js/*.js` — Scripts included in alphabetical order with CSP nonce.
- `media/chat/html/{head,header,messages,footer}/**/*.html` — Safe fragments injected into the template.

## Behavior

- Loads assets via `webview.asWebviewUri` and appends `?v=<mtime>` for cache busting.
- Validates HTML fragments (no `<script>` or CSP meta tags) and injects warnings if any are rejected.
- Watches `media/chat/**/*.{css,js}` and `media/chat/html/**/*.html` during development to refresh the panel.
- Uses a factory pattern for instantiation with proper disposal handling.
- UI bootstrap: `main.js` constructs a `Renderer`, calls `mountAll(document)`, posts `ui.ready`, and forwards extension messages to `renderer.handle()`.
 - Mock transport: on first user message, the extension persists the user message and posts a simple `assistant.commit` echo ("Echo: <text>") after a short delay. This is a placeholder until real transport is wired.

## Key Features

- **CSP Security**: Nonce-bound external scripts and proper CSP configuration
- **Asset Management**: Automatic loading and injection of CSS, JS, and HTML fragments
- **Development Experience**: Auto-refresh when assets change during development
- **Error Handling**: Graceful fallback when HTML template fails to load
- **Resource Cleanup**: Proper disposal of watchers and event listeners
- **Element Registry**: `Renderer` owns registration; `ElementsRegistry` mounts/updates/disposes controllers

## Design Principles

1. **User Experience**: Accessible, responsive chat UI with proper error handling
2. **Integration**: Follows VS Code Webview best practices and CSP security model
3. **Performance**: Batches rebuild with debounce and sorted asset loading
4. **Maintainability**: Clear separation of concerns with factory pattern for instantiation
5. **Security**: Validates HTML fragments to prevent script injection
6. **Developer Experience**: Auto-refresh during development for rapid iteration
7. **Single DOM Truth**: `[data-el]` anchors with idempotent mounts; classes for styling only
