# Chat Webview Module

## Overview

The chat webview module provides the user interface for Codex chat as a dedicated `WebviewPanel`. It builds the panel HTML from a template and dynamically loads styles, scripts, and HTML fragments.

## Implementation Status

Implemented and used as the sole UI for chat.

## Key Files

- `src/ui/chat-webview.ts` — Creates the `WebviewPanel`, assembles HTML, wires CSP, and watches assets.
- `src/ui/chat-panel-manager.ts` — Manages a single open instance and reveal behavior.
- `media/chat/index.html` — HTML template with placeholders for assets and fragments.
- `media/chat/styles/*.css` — Stylesheets included in alphabetical order.
- `media/chat/js/*.js` — Scripts included in alphabetical order with CSP nonce.
- `media/chat/html/{head,body}/**/*.html` — Safe fragments injected into the template.

## Behavior

- Loads assets via `webview.asWebviewUri` and appends `?v=<mtime>` for cache busting.
- Validates fragments (no `<script>` or CSP meta) and injects warnings if any are rejected.
- Watches `media/chat/**/*.{css,js}` and `media/chat/html/**/*.html` during development to refresh the panel.

## Design Principles

1. User Experience: Accessible, responsive chat UI
2. Integration: Follows VS Code Webview best practices and CSP
3. Performance: Batches rebuild with debounce and sorted asset loading
4. Accessibility: Semantic markup and keyboard interaction support
