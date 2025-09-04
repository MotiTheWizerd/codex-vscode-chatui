# UI: Chat Panel (WebviewPanel)

This documents the working setup for the Chat panel that hosts the chat UI as a `WebviewPanel` (not a sidebar view).

## Overview

- Command: `codex.openChatPanel`
- Panel class: `src/ui/chat-webview.ts`
- Manager: `src/ui/chat-panel-manager.ts` (ensures a single instance)
- Activation: `onCommand:codex.openChatPanel`

## Extension Wiring

- File: `src/ext/extension.ts`
  - Creates `CoreManager` and `Logger`.
  - Registers command `codex.openChatPanel` that calls `ChatPanelManager.open(context, core)`.

## Asset Pipeline

- Base HTML template: `media/chat/index.html` (placeholders: `{{STYLES}}`, `{{SCRIPTS}}`, `{{NONCE}}`, `{{CSP_SOURCE}}`, `{{HEAD_PARTS}}`, `{{BODY_PARTS}}`).
- Styles: `media/chat/styles/*.css` (alphabetical order).
- Scripts: `media/chat/js/*.js` (alphabetical order, nonce applied).
- Fragments: `media/chat/html/head/**/*.html` and `media/chat/html/body/**/*.html` (validated, no `<script>` or CSP meta).
- Cache-busting: `?v=<mtime>` query param per asset.

## How To Use

- Open Command Palette → “Codex: Open Chat” → opens/focuses the Chat panel.

## Dependencies

- VS Code WebviewPanel API (`vscode`).
- Core services via `CoreManager` and project path aliases.
