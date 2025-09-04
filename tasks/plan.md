# Codex VS Code Chat Extension – MVP Plan

## 🎯 Scope (MVP)
- VS Code chat panel that connects to Codex server (CLI-compatible).
- Token streaming with retry/backoff.
- One tool call (e.g., `Run Command` stub).
- Session persistence per workspace.
- Config + secrets handling (workspace/user level).
- Basic telemetry + error taxonomy.

---

## 🏗️ Architecture (Ports & Adapters)

### **core/**
- `CoreManager`: lifecycle, orchestration, routing
- `EventBus`: pub/sub channel for events
- `PolicyGuard`: permission + rate limiting
- `ConfigService`: merges workspace/user config
- `Errors`: error taxonomy + retry strategies
- `DI`: dependency injection / registry

### **transport/**
- Codex client (REST + WebSocket)
- Auth header injection
- Retry/backoff strategies
- Streaming protocol handler
- Types + schema definitions

### **ui/**
- `ChatWebview`: panel host + message protocol
- Streaming renderer (token-by-token)
- UI assets (HTML/CSS/JS)
- Panel commands (open/close, focus)

### **tools/**
- `ToolBus`: plugin API for tools
- One built-in tool: `shell` (stub only for MVP)
- Capability schemas
- Registry for dynamic tools

### **state/**
- `SessionStore`: conversation + messages
- IndexedDB (webview) or workspace storage
- Cache with eviction policy
- Migrations for schema upgrades

### **config/**
- Settings manager (workspace/user scopes)
- Secrets provider (API keys, redaction)
- Feature flags loader

### **telemetry/**
- Structured logger
- Metrics (events, latencies, failures)
- Error reporter (taxonomy-based)

### **ext/**
- VS Code `extension.ts`
- Activation/deactivation
- Commands + contributions
- Context keys for UI integration

### **test/**
- Unit tests for modules
- Contract tests for transport + tools
- E2E: activation + chat flow

---

## 🚦 Core Flows

1. **Extension Activate**
   - CoreManager bootstraps
   - Config + secrets loaded
   - EventBus + registry initialized

2. **Open Chat Panel**
   - UI creates webview
   - CoreManager subscribes to events

3. **Send Message**
   - UI → EventBus → CoreManager
   - CoreManager routes → Transport

4. **Stream Response**
   - Transport receives tokens
   - Publishes to EventBus
   - UI subscribes and renders incrementally

5. **Tool Call**
   - Message → ToolBus
   - Executes tool → returns result
   - CoreManager routes back to UI

6. **Persist Session**
   - Messages stored in SessionStore
   - Restore on next load

---

## 📂 Folder Structure

```
codex-ext/
├── core/
│   ├── manager.ts
│   ├── event-bus.ts
│   ├── policy.ts
│   ├── config.ts
│   ├── di.ts
│   └── errors.ts
├── transport/
│   ├── client.ts
│   ├── ws-handler.ts
│   └── types.ts
├── ui/
│   ├── chat-webview.ts
│   ├── renderer.ts
│   └── assets/
├── tools/
│   ├── tool-bus.ts
│   └── shell-tool.ts
├── state/
│   ├── session-store.ts
│   └── migrations.ts
├── config/
│   ├── settings.ts
│   └── secrets.ts
├── telemetry/
│   ├── logger.ts
│   ├── metrics.ts
│   └── reporter.ts
├── ext/
│   └── extension.ts
└── test/
    ├── unit/
    ├── contract/
    └── e2e/
```

---

## ✅ MVP Deliverables
- Extension activates, opens chat panel.
- Can send + receive messages (streamed).
- Sessions stored/restored.
- One dummy tool integrated.
- Basic config/secrets.
- Logs + error categories.

---
