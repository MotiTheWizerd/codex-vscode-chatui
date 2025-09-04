# Agent Manager Docs (Quick Notes)

This folder tracks the current working structure for modules touched by the latest review: logging, typing for tools/state, and network resiliency.

- Telemetry: `src/telemetry/log.ts`, `src/telemetry/err.ts`
- Types: `src/types/tools.ts`, `src/types/chat.ts`, `src/types/ipc.ts`
- Network: `src/transport/http.ts`, `src/transport/client.ts`, `src/transport/ws-handler.ts`
- State: `src/state/session-store.ts`, `src/state/migrations.ts`

See the per-module docs for usage and examples.

