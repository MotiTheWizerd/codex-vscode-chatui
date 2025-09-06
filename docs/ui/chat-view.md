# Chat View (Sidebar)

## Overview

The chat UI is hosted as a Sidebar View using a `WebviewView` inside a custom View Container. This replaces the legacy `WebviewPanel` approach and provides better persistence and UX, consistent with other IDE chat panels.

## IDs and Commands

- View Container: `codex`
- View ID: `codex.chatView`
- Focus Command: `codex.chat.focus`
- Programmatic focus: `workbench.view.showView` with `codex.chatView`

## Files

- `src/ui/chat-view-provider.ts` — WebviewView provider, message wiring, asset refresh
- `src/ui/chatHtml.ts` — HTML builder reused by the view (CSP, assets, fragments)
- `package.json` — contributes `viewsContainers.activitybar` and `views.codex`

## Behavior

- Keeps `retainContextWhenHidden` for stable streaming and state
- Tracks visibility via `codex.chatVisible` context key
- Reuses existing assets from `media/chat` and compiled scripts from `dist/ui`
- Forwards UI messages to CoreManager via `Events.UiSend`
- Forwards transport events (`assistant.token`, `assistant.commit`) back to the UI

## Migration Notes

- The old `codex.openChatPanel` command now redirects to `codex.chat.focus`
- The legacy `ChatPanelManager` remains in the codebase but is no longer used

