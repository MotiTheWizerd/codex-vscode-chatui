# Session Manager Module

## Overview

The Session Manager module provides session management functionality for the CoreManager. It handles operations related to getting, creating, and managing chat sessions.

## Class

### SessionManager

A class that provides session management functionality for the CoreManager.

## Constructor

```typescript
constructor(manager: CoreManager)
```

Creates a new SessionManager instance with a reference to the CoreManager.

**Parameters:**
- `manager` - The CoreManager instance that this SessionManager belongs to

## Methods

### async getOrCreateSession(): Promise<ChatSession>

Gets the current session if it exists, or creates a new session if one doesn't exist.

**Returns:** `Promise<ChatSession>` - The existing or newly created chat session

**Process:**
1. Checks if there's an existing current session
2. If an existing session is found, returns it
3. If no existing session is found, creates a new session using the SessionStore
4. Throws an error if the SessionStore is not available

### getCurrentSession(): ChatSession | null

Gets the current session without creating a new one.

**Returns:** `ChatSession | null` - The current chat session or null if none exists

**Process:**
1. Returns the current session from the SessionStore if available
2. Returns null if no SessionStore is available or no current session exists

## Usage

The SessionManager is used internally by the CoreManager and its sub-components:

```typescript
import { SessionManager } from './SessionManager';

const sessionManager = new SessionManager(coreManager);

// Get or create a session
const session = await sessionManager.getOrCreateSession();

// Get current session (null if none exists)
const currentSession = sessionManager.getCurrentSession();
```

## Design Principles

1. **Session Abstraction**: Provides a clean abstraction for session management operations
2. **Lazy Initialization**: Only creates sessions when needed
3. **Error Handling**: Properly handles cases where SessionStore is not available
4. **Consistency**: Ensures consistent session access patterns across the CoreManager
5. **Simplicity**: Provides a simple API for common session operations