# Module Audits

## Core
- **Purpose:** Orchestrates services and event routing.
- **Public API:** `CoreManager`, `EventBus`
- **Dependencies:** path aliases (`@core/*`), telemetry/logger.
- **Boundary:** Mostly clean; EventBus exposed to UI.
- **State/Lifecycle:** CoreManager holds singletons; ensure dispose.
- **Config:** Reads from `config/settings.ts`.
- **Telemetry:** Basic logging via `logger.ts`.
- **Tests:** none.
- **Size/Complexity:** `core/manager.ts` ~220 LOC.
- **Risks:**
  - P1: Hidden singletons via CoreManager.
  - P2: Unhandled rejections in async bootstrap.
  - P3: No unit tests.

## UI
- **Purpose:** Webview and renderer for chat UI.
- **API:** `ChatWebview`, `MessageBridge`.
- **Dependencies:** React not used; direct DOM.
- **Boundary:** Uses `postMessage` strings; lacks typing.
- **State/Lifecycle:** Controllers may leak listeners on dispose.
- **Config:** Hardcoded asset paths.
- **Telemetry:** none.
- **Tests:** none.
- **Size/Complexity:** `chat-webview.ts` >400 LOC.
- **Risks:**
  - P1: Long controller file.
  - P2: Untyped messaging.
  - P3: Missing disposal safeguards.

## Extension
- **Purpose:** VS Code activation and command registration.
- **API:** `activate`, `deactivate`.
- **Dependencies:** `vscode`, core bootstrap.
- **Boundary:** Thin wrapper; clean.
- **State:** relies on VS Code context disposables.
- **Config:** activation events in `package.json`.
- **Telemetry:** none.
- **Tests:** none.
- **Size:** small (~20 LOC).
- **Risks:**
  - P2: No error handling around `bootstrap`.

## Modules/Composer
- **Purpose:** Input composer UI.
- **API:** `Composer` component.
- **Dependencies:** DOM, message bridge.
- **Boundary:** Depends on global `vscode` API; alias path usage inconsistent.
- **State:** Attaches event listeners; no teardown.
- **Config:** none.
- **Telemetry:** none.
- **Tests:** none.
- **Size:** `composer-dom.ts` ~170 LOC.
- **Risks:**
  - P1: Missing dispose of listeners.
  - P2: Global vscode reliance.

## Transport
- **Purpose:** HTTP / WebSocket communication.
- **API:** `withTimeout`, `WebSocketHandler`.
- **Dependencies:** node-fetch/WebSocket (not shown).
- **Boundary:** Types defined but unused.
- **State:** none.
- **Config:** retry options inline.
- **Telemetry:** none.
- **Tests:** none.
- **Size:** small files.
- **Risks:**
  - P2: Unused exports indicate dead code.

## Telemetry
- **Purpose:** Logging and metrics.
- **API:** `Logger`.
- **Dependencies:** none external.
- **Boundary:** Logger tightly coupled to CoreManager.
- **State:** singleton via context.
- **Config:** none.
- **Telemetry:** basic console only.
- **Tests:** none.
- **Size:** moderate.
- **Risks:**
  - P2: No log levels or structured data.

## State
- **Purpose:** Session persistence.
- **API:** `SessionStore`, `MigrationManager`.
- **Dependencies:** config.
- **Boundary:** Not integrated.
- **State:** persistent state schema.
- **Config:** none.
- **Telemetry:** none.
- **Tests:** none.
- **Size:** small.
- **Risks:**
  - P3: Unused code.

## Tools
- **Purpose:** Tool adapter stubs.
- **API:** `ToolBus`, `ShellTool`.
- **Dependencies:** child_process.
- **Boundary:** minimal.
- **State:** none.
- **Config:** none.
- **Telemetry:** none.
- **Tests:** none.
- **Size:** small.
- **Risks:**
  - P3: Incomplete implementations.
