# Events Module

The events module defines centralized event names and payload types used throughout the extension. It establishes stable contracts for inter-module communication without containing runtime logic.

## Overview

The `events.ts` file provides a centralized registry of all events used in the extension, along with their corresponding payload types. This ensures type safety and consistency across the event system.

## Event Registry

### Core Lifecycle Events

```typescript
Events.CoreReady = "core:ready"        // Core system initialization complete
Events.CoreShutdown = "core:shutdown"   // Core system shutdown initiated
```

### Session Management Events

```typescript
Events.SessionRestored = "session:restored"  // Chat session restored from storage
```

### UI Communication Events

```typescript
Events.UiSend = "ui:send"  // User message sent from UI
```

### Transport Events

```typescript
Events.TransportStarted = "transport:started"    // Streaming response started
Events.TransportToken = "transport:token"        // Token received during streaming
Events.TransportComplete = "transport:complete"  // Streaming response completed
Events.TransportError = "transport:error"       // Transport error occurred
```

### Tool System Events

```typescript
Events.ToolInvoke = "tool:invoke"    // Tool execution requested
Events.ToolResult = "tool:result"    // Tool execution completed successfully
Events.ToolError = "tool:error"      // Tool execution failed
```

## Payload Types

### `UiSendPayload`

Payload for user-initiated messages.

```typescript
interface UiSendPayload {
  text: string;                    // Message text content
  streaming?: boolean;             // Enable streaming response
  options?: Record<string, unknown>; // Additional options
}
```

### `TransportStartedPayload`

Payload for transport initialization.

```typescript
interface TransportStartedPayload {
  sessionId: string;   // Chat session identifier
  messageId: string;   // Message identifier
}
```

### `TransportTokenPayload`

Payload for streaming tokens.

```typescript
interface TransportTokenPayload {
  sessionId: string;   // Chat session identifier
  messageId: string;   // Message identifier
  token: string;       // Token content
}
```

### `TransportCompletePayload`

Payload for transport completion.

```typescript
interface TransportCompletePayload {
  sessionId: string;   // Chat session identifier
  messageId: string;   // Message identifier
}
```

### `TransportErrorPayload`

Payload for transport errors.

```typescript
interface TransportErrorPayload {
  sessionId?: string;  // Chat session identifier (optional)
  messageId?: string; // Message identifier (optional)
  error: string;      // Error message
}
```

### `ToolInvokePayload`

Payload for tool invocation.

```typescript
interface ToolInvokePayload {
  name: string;       // Tool name
  args: unknown;      // Tool arguments
}
```

### `ToolResultPayload`

Payload for successful tool execution.

```typescript
interface ToolResultPayload {
  name: string;       // Tool name
  result: unknown;    // Tool execution result
}
```

### `ToolErrorPayload`

Payload for tool execution errors.

```typescript
interface ToolErrorPayload {
  name: string;       // Tool name
  error: string;      // Error message
}
```

### `SessionRestoredPayload`

Payload for session restoration.

```typescript
interface SessionRestoredPayload {
  session: ChatSession;  // Restored chat session
  messageCount: number; // Number of messages in session
}
```

## Type Definitions

### `EventName`

Union type of all event names.

```typescript
type EventName = typeof Events[keyof typeof Events];
```

This provides compile-time type safety for event names.

## Usage Examples

### Event Emission

```typescript
import { Events, type UiSendPayload } from "@/core/events";
import { EventBus } from "@/core/event-bus";

const eventBus = new EventBus();

// Emit a UI send event
const payload: UiSendPayload = {
  text: "Hello, world!",
  streaming: true
};

eventBus.emit(Events.UiSend, payload);
```

### Event Listening

```typescript
import { Events, type TransportTokenPayload } from "@/core/events";
import { EventBus } from "@/core/event-bus";

const eventBus = new EventBus();

// Listen for transport tokens
eventBus.on(Events.TransportToken, (payload: TransportTokenPayload) => {
  console.log(`Token for session ${payload.sessionId}: ${payload.token}`);
});
```

### Type-Safe Event Handling

```typescript
import { Events, type EventName } from "@/core/events";

function handleEvent(eventName: EventName, payload: unknown) {
  switch (eventName) {
    case Events.UiSend:
      // payload is automatically typed as UiSendPayload
      const uiPayload = payload as UiSendPayload;
      break;
    case Events.TransportToken:
      // payload is automatically typed as TransportTokenPayload
      const tokenPayload = payload as TransportTokenPayload;
      break;
  }
}
```

## Design Principles

1. **Centralized Registry** - All events are defined in one place for consistency
2. **Type Safety** - Strong typing for all event payloads
3. **Stable Contracts** - Event names and payloads are designed to be stable
4. **No Runtime Logic** - This module only defines contracts, not behavior
5. **Minimal Dependencies** - Only imports necessary types from other modules

## Integration

This module integrates with:
- `@/core/event-bus` - Event bus implementation
- `@/types/chat` - Chat session types
- All modules that emit or listen to events
