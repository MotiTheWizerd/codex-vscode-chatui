# Session Store Module

## Overview

The session store module manages persistent storage of session data for the Codex extension. It handles saving and retrieving chat sessions, conversation history, and other session-specific data using VS Code's workspace state storage.

## Implementation Status

Implemented. The module provides persistent storage for session data using VS Code's workspaceState API.

## Class

### SessionStore

Manages chat sessions and persists them to VS Code's workspace storage.

## Constructor

```typescript
constructor(context: vscode.ExtensionContext, logger: Logger | null = null)
```

Creates a new SessionStore instance with the VS Code extension context and optional logger.

## Methods

### async createSession(): Promise<ChatSession>

Creates a new chat session with a unique ID and initializes it with empty messages.

Returns: A Promise that resolves to the newly created ChatSession.

### getCurrentSession(): ChatSession | null

Gets the current active session.

Returns: The current ChatSession or null if no session exists.

### async addMessageToCurrentSession(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage>

Adds a message to the current session, automatically generating an ID and timestamp.

Parameters:
- `message`: The message to add (without id and timestamp, which are generated automatically)

Returns: A Promise that resolves to the created ChatMessage with generated ID and timestamp.

### getSessions(): ChatSession[]

Gets all stored sessions.

Returns: An array of all ChatSession objects.

### async clearCurrentSession(): Promise<void>

Clears the current session, removing it from storage.

Returns: A Promise that resolves when the operation is complete.

### async dispose(): Promise<void>

Disposes of the session store, ensuring all sessions are saved before disposal.

Returns: A Promise that resolves when the operation is complete.

## Data Structures

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
```

### ChatSession
```typescript
interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Features

- **Session Management**: Create, retrieve, and manage chat sessions
- **Message Persistence**: Add messages to sessions with automatic ID and timestamp generation
- **VS Code Integration**: Uses VS Code's workspaceState for persistent storage
- **Automatic Saving**: Sessions are automatically saved after each modification
- **Current Session Tracking**: Maintains a reference to the current active session
- **Logging**: Integrates with the extension's logging system
- **Resource Cleanup**: Implements VS Code's Disposable pattern for proper cleanup

## Design Principles

1. **Persistence**: Ensures session data survives VS Code restarts using workspaceState
2. **Performance**: Optimizes storage and retrieval operations
3. **Automatic Management**: Automatically handles ID generation and timestamp management
4. **Error Handling**: Includes proper error handling and logging
5. **VS Code Integration**: Follows VS Code's patterns and APIs
6. **Resource Management**: Implements proper disposal pattern

## Usage

```typescript
import { SessionStore } from '@state/session-store';

// Create a session store (typically done in CoreManager)
const sessionStore = new SessionStore(context, logger);

// Create a new session
const session = await sessionStore.createSession();

// Add a message to the current session
const message = await sessionStore.addMessageToCurrentSession({
  role: 'user',
  content: 'Hello, Codex!'
});

// Get the current session
const currentSession = sessionStore.getCurrentSession();

// Get all sessions
const allSessions = sessionStore.getSessions();

// Clear the current session
await sessionStore.clearCurrentSession();
```

## Integration with CoreManager

The SessionStore is instantiated and managed by the CoreManager:

```typescript
// In CoreManager.initialize()
this.sessionStore = new SessionStore(this.context, this.logger ?? null);
this.di.register("sessionStore", this.sessionStore);
```

Other parts of the application can then access the session store through the DI container:

```typescript
const sessionStore = diContainer.get<SessionStore>('sessionStore');
```

## Source

- `src/state/session-store.ts`
- `src/types/chat.ts`