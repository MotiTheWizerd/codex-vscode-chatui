# Core Manager Module

Status: Implemented

## Overview

The CoreManager is the central orchestrator for the Codex extension. It initializes all core services, manages their lifecycle, and provides access to them through a dependency injection container. It also implements VS Code's Disposable interface for proper resource cleanup.

## Class

### CoreManager

The main manager class that handles the lifecycle and orchestration of the extension.

## Constructor

```typescript
constructor(context: vscode.ExtensionContext, logger?: Logger)
```

Creates a new CoreManager instance with the VS Code extension context and optional logger.

## Properties

- `eventBusInstance`: The event bus for pub/sub communication
- `config`: The configuration service for managing settings
- `policies`: The policy guard for permissions and rate limiting
- `session`: The session store for managing user sessions (nullable)
- `tools`: The tool bus for managing tools (nullable)
- `codex`: The Codex client for API communication (nullable)
- `diContainer`: The dependency injection container for service management

## Methods

### async initialize(): Promise<void>

Initialize all core services:
1. Load configuration
2. Initialize the dependency injection container
3. Register all core services with the container
4. Instantiate additional services (SessionStore, ToolBus, CodexClient)
e5. Initialize policy guard
6. Register event handlers for runtime flows
7. Check for session restoration
8. Publish "core:ready" event

This method is idempotent - calling it multiple times will only initialize once.

### eventBusInstance(): EventBus

Get the event bus instance.

### config(): ConfigService

Get the configuration service instance.

### policies(): PolicyGuard

Get the policy guard instance.

### session(): SessionStore | null

Get the session store instance, or null if not initialized.

### tools(): ToolBus | null

Get the tool bus instance, or null if not initialized.

### codex(): CodexClient | null

Get the Codex client instance, or null if not initialized.

### diContainer(): DIContainer

Get the dependency injection container instance.

### async shutdown(): Promise<void>

Perform cleanup operations when the extension is shutting down:
1. Publish "core:shutdown" event
2. Unsubscribe event handlers
3. Dispose all tracked disposables
4. Shutdown policy guard and session store
5. Reset initialization flags

### dispose(): void

Implementation of VS Code's Disposable interface. Calls shutdown() asynchronously.

### Additional Helpers

- `getOrCreateSession`: Ensures a current session exists and returns it.
- `getCurrentSession`: Returns the current session or null.

## Usage

```typescript
import { CoreManager } from '@core/manager';

// Create and initialize the core manager
const coreManager = new CoreManager(context, logger);
await coreManager.initialize();

// Access core services
const eventBus = coreManager.eventBusInstance;
const configService = coreManager.config;
const diContainer = coreManager.diContainer;

// VS Code will call dispose() when the extension is deactivated
// Or you can call shutdown() directly:
await coreManager.shutdown();
```

## Service Registration

During initialization, the CoreManager registers the following services with the DI container:
- `eventBus`: The EventBus instance
- `configService`: The ConfigService instance
- `policyGuard`: The PolicyGuard instance
- `context`: The VS Code ExtensionContext
- `logger`: The Logger instance (if provided)
- `sessionStore`: The SessionStore instance (if initialized)
- `toolBus`: The ToolBus instance (if initialized)
- `codexClient`: The CodexClient instance (if initialized)

## Design Principles

1. **Central Orchestration**: Single point of control for core service lifecycle
2. **Dependency Management**: Uses DI container to manage service dependencies
3. **Async Initialization**: Supports async initialization of services
4. **Clean Shutdown**: Provides a method for graceful shutdown
5. **Service Access**: Provides both direct access and container access to services
6. **VS Code Integration**: Properly integrates with VS Code's lifecycle through Disposable pattern
7. **Extensible**: Designed to be extended with additional services as needed
8. **Error Resilience**: Shutdown process handles disposal errors gracefully

## Events

The CoreManager implements a comprehensive event system for communication between components. Here are the events with their payloads and usage:

### Core Lifecycle Events

#### `core:ready`
Published when CoreManager has finished initializing all services.

**Payload**: None

**Usage**:
```typescript
core.eventBusInstance.subscribe(Events.CoreReady, () => {
  console.log("Core services are ready");
});
```

#### `core:shutdown`
Published when CoreManager begins shutting down.

**Payload**: None

**Usage**:
```typescript
core.eventBusInstance.subscribe(Events.CoreShutdown, () => {
  console.log("Core services are shutting down");
});
```

### Session Events

#### `session:restored`
Published during initialization if a session with existing messages is found.

**Payload**: 
```typescript
interface SessionRestoredPayload {
  session: ChatSession;
  messageCount: number;
}
```

**Usage**:
```typescript
core.eventBusInstance.subscribe(Events.SessionRestored, (payload: SessionRestoredPayload) => {
  console.log(`Restored session with ${payload.messageCount} messages`);
});
```

### UI → Core Events

#### `ui:send`
Published when the UI wants to send a message to the Codex backend.

**Payload**:
```typescript
interface UiSendPayload {
  text: string;
  streaming?: boolean;
  options?: Record<string, unknown>;
}
```

**Usage**:
```typescript
core.eventBusInstance.publish(Events.UiSend, { 
  text: "Hello Codex", 
  streaming: true 
});
```

### Transport Events

#### `transport:started`
Published when a message send operation begins.

**Payload**:
```typescript
interface TransportStartedPayload {
  sessionId: string;
  messageId: string;
}
```

#### `transport:token`
Published for each token received during streaming.

**Payload**:
```typescript
interface TransportTokenPayload {
  sessionId: string;
  messageId: string;
  token: string;
}
```

#### `transport:complete`
Published when a message send operation completes.

**Payload**:
```typescript
interface TransportCompletePayload {
  sessionId: string;
  messageId: string;
}
```

#### `transport:error`
Published when a transport error occurs.

**Payload**:
```typescript
interface TransportErrorPayload {
  sessionId?: string;
  messageId?: string;
  error: string;
}
```

### Tool Events

#### `tool:invoke`
Published when a tool execution is requested.

**Payload**:
```typescript
interface ToolInvokePayload {
  name: string;
  args: unknown;
}
```

#### `tool:result`
Published when a tool execution completes successfully.

**Payload**:
```typescript
interface ToolResultPayload {
  name: string;
  result: unknown;
}
```

#### `tool:error`
Published when a tool execution fails.

**Payload**:
```typescript
interface ToolErrorPayload {
  name: string;
  error: string;
}
```

## Runtime Flows

### Message Send/Stream Flow:
1. UI publishes `ui:send` event with message text
2. CoreManager's event handler performs policy and rate-limit checks
3. User message is persisted to session store
4. `transport:started` event is published
5. Codex client is called to send the message
6. For streaming responses:
   - Each token triggers a `transport:token` event
7. For non-streaming responses:
   - Single response is received
8. Assistant message is persisted to session store
9. `transport:complete` event is published
10. Policy guard records the request

### Error Handling:
- Transport errors publish `transport:error` events
- Tool errors publish `tool:error` events
- All errors are logged appropriately

### Tool Execution Flow:
1. Component publishes `tool:invoke` event with tool name and arguments
2. CoreManager's event handler calls ToolBus.execute()
3. On success, publishes `tool:result` event with result
4. On failure, publishes `tool:error` event with error message
5. Optionally persists tool output as an assistant message

### Session Restoration Flow:
1. During initialization, CoreManager checks for existing session history
2. If found, publishes `session:restored` event with session data
3. UI components can subscribe to this event to restore chat history

## Usage Examples

### Sending a Message
```typescript
import { Events } from '@core/events';
import { CoreManager } from '@core/manager';

// Given a manager instance `core`
core.eventBusInstance.publish(Events.UiSend, { 
  text: 'Hello Codex', 
  streaming: true 
});
```

### Listening for Transport Tokens (Streaming)
```typescript
import { Events } from '@core/events';

core.eventBusInstance.subscribe(Events.TransportToken, (payload) => {
  console.log(`Received token: ${payload.token}`);
  // Update UI with new token
});
```

### Executing a Tool
```typescript
import { Events } from '@core/events';

core.eventBusInstance.publish(Events.ToolInvoke, {
  name: 'shell',
  args: { command: 'ls -la' }
});
```

### Handling Tool Results
```typescript
import { Events } from '@core/events';

core.eventBusInstance.subscribe(Events.ToolResult, (payload) => {
  console.log(`Tool ${payload.name} returned:`, payload.result);
  // Process tool result
});
```

### Session Restoration
```typescript
import { Events } from '@core/events';

core.eventBusInstance.subscribe(Events.SessionRestored, (payload) => {
  console.log(`Restored session with ${payload.messageCount} messages`);
  // Restore chat UI with previous messages
});
```

## Source

- `src/core/manager.ts:1`
- `src/core/events.ts:1`

## Cross‑Links

- UI: `docs/ui/ui.md`, `docs/ui/chat-webview.md`, `docs/ui/chat_ui_workflow.md`
- Transport: `docs/transport/client.md`, `docs/transport/ws-handler.md`, `docs/transport/types.md`
- Tools: `docs/tools/tool-bus.md`, `docs/tools/shell-tool.md`
- State: `docs/state/session-store.md`
- Telemetry: `docs/telemetry/logger.md`, `docs/telemetry/reporter.md`
- Core: `docs/core/event-bus.md`, `docs/core/policy.md`, `docs/core/di.md`, `docs/core/errors.md`
- Activation: `docs/ext/extension.md`