# Helpers Module

## Overview

The Helpers module provides utility functions for the CoreManager. It includes logging and disposable tracking functionality that is shared across the CoreManager's sub-components.

## Class

### Helpers

A utility class that provides common helper functions for the CoreManager and its sub-components.

## Constructor

```typescript
constructor(context: vscode.ExtensionContext, logger: Logger | null = null)
```

Creates a new Helpers instance with the VS Code extension context and optional logger.

## Methods

### trackDisposable(disposables: vscode.Disposable[], d?: vscode.Disposable)

Tracks a disposable object by adding it to both the provided disposables array and the extension context subscriptions.

**Parameters:**
- `disposables` - Array of disposables to track
- `d` - Optional disposable to track

### logInfo(msg: string, logger: Logger | null, meta?: Record<string, unknown>)

Logs an info message using the provided logger.

**Parameters:**
- `msg` - Message to log
- `logger` - Logger instance to use (can be null)
- `meta` - Optional metadata to include in the log

### logError(msg: string, logger: Logger | null, err: unknown)

Logs an error message using the provided logger.

**Parameters:**
- `msg` - Message to log
- `logger` - Logger instance to use (can be null)
- `err` - Error object to log

### logWarn(msg: string, logger: Logger | null, meta?: Record<string, unknown>)

Logs a warning message using the provided logger.

**Parameters:**
- `msg` - Message to log
- `logger` - Logger instance to use (can be null)
- `meta` - Optional metadata to include in the log

## Usage

The Helpers class is used internally by the CoreManager and its sub-components to provide common functionality:

```typescript
import { Helpers } from './Helpers';

const helpers = new Helpers(context, logger);

// Track a disposable
helpers.trackDisposable(disposables, someDisposable);

// Log messages
helpers.logInfo("Operation completed", logger, { duration: 100 });
helpers.logError("Operation failed", logger, error);
helpers.logWarn("Operation partially completed", logger, { partialResult: true });
```

## Design Principles

1. **Utility Functions**: Provides common helper functions used across CoreManager components
2. **Logging Consistency**: Ensures consistent logging across all core components
3. **Disposable Tracking**: Simplifies disposable tracking by automatically adding to both local array and extension context
4. **Null Safety**: Handles cases where logger might be null
5. **Error Handling**: Provides consistent error message formatting