# Architecture Overview

## Surfaces
- **Activation:** `src/ext/extension.ts` → `bootstrap()`
- **Commands:** `codex.openChatPanel`, `codex.showMenu`, `codex.showLogs`
- **Webview:** `media/chat/index.html` served by `src/ui/chat-webview.ts`
- **Messaging:** `user.send`, `assistant.token`, `assistant.commit` via `postMessage`

## Build
- TypeScript compiled with `tsc` to `dist/`
- Path aliases: `@/*`, `@core/*`, `@core-manager`
- No bundler; assets under `media/` loaded directly

## Key Flows

### Chat Send Flow
```
UI composer → bridge.post('user.send') → extension Webview.onDidReceiveMessage → EventBus.publish('chat.send') → model call → EventBus.publish('assistant.token') → webview.postMessage → UI render
```

### Panel Bootstrap
```
Extension activates → registers commands → user runs `codex.openChatPanel` → `ChatWebview` loads HTML/CSS/JS → controller mounts → `ui.ready`
```

### Tool Execution
```
User command → EventBus.publish('tool.invoke') → tool adapter executes → result events → UI displays output
```

## Shared State & Risks
- `EventBus` singleton in `CoreManager`
- Potential failure points: untyped `postMessage` payloads, missing error handling in async calls
