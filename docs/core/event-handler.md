# Event Handler Module

## Overview

The Event Handler module is responsible for registering and unregistering event handlers for the CoreManager. It handles UI events, transport events, and tool events, providing the core event processing logic for the extension.

## Class

### EventHandler

A class that manages event handler registration and unregistration for the CoreManager.

## Constructor

```typescript
constructor(manager: CoreManager)
```

Creates a new EventHandler instance with a reference to the CoreManager.

**Parameters:**
- `manager` - The CoreManager instance that this EventHandler belongs to

## Methods

### registerEventHandlers()

Registers all event handlers for the CoreManager:
1. UI send handler for processing user messages
2. Tool invoke handler for processing tool execution requests

The method sets up handlers for:
- `Events.UiSend` - Processes user messages with policy checks, rate limiting, and transport
- `Events.ToolInvoke` - Processes tool execution requests

### unregisterEventHandlers()

Unregisters all event handlers that were registered by the EventHandler:
1. UI send handler
2. Tool invoke handler

## Event Processing

### UI Send Event Handling

When an `Events.UiSend` event is received, the handler:

1. Performs policy checks to ensure the chat feature is allowed
2. Checks rate limits for the chat feature
3. Gets or creates a session
4. Adds the user message to the session store
5. Publishes a `transport:started` event
6. Sends the message to the Codex client (streaming or non-streaming)
7. For streaming responses:
   - Publishes `transport:token` events for each token received
   - Adds the complete assistant message to the session store
8. For non-streaming responses:
   - Adds the assistant message to the session store
9. Publishes a `transport:complete` event
10. Records the request for rate limiting

If any errors occur during processing, a `transport:error` event is published.

### Tool Invoke Event Handling

When an `Events.ToolInvoke` event is received, the handler:

1. Validates that a tool name was provided
2. Ensures the ToolBus is available
3. Executes the requested tool with the provided arguments
4. On success:
   - Publishes a `tool:result` event with the result
   - Optionally persists the tool result as an assistant message
5. On failure:
   - Publishes a `tool:error` event with the error message

## Usage

The EventHandler is used internally by the CoreManager:

```typescript
import { EventHandler } from './EventHandler';

const eventHandler = new EventHandler(coreManager);

// Register event handlers during initialization
eventHandler.registerEventHandlers();

// Unregister event handlers during shutdown
eventHandler.unregisterEventHandlers();
```

## Design Principles

1. **Event-Driven**: Processes events from the EventBus to handle core functionality
2. **Decoupled**: Separates event handling logic from CoreManager implementation
3. **Robust Error Handling**: Handles errors gracefully and publishes error events
4. **Policy Enforcement**: Enforces feature permissions and rate limiting
5. **Session Management**: Integrates with session management for message persistence
6. **Transport Integration**: Coordinates with transport layer for message sending
7. **Tool Integration**: Coordinates with tool system for tool execution