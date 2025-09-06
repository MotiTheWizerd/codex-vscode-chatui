# Shutdown Manager Module

## Overview

The Shutdown Manager module is responsible for cleanly shutting down all core services of the CoreManager. It handles the shutdown sequence, including event notification, resource disposal, and service cleanup.

## Class

### ShutdownManager

A class that manages the shutdown process for the CoreManager.

## Constructor

```typescript
constructor(manager: CoreManager)
```

Creates a new ShutdownManager instance with a reference to the CoreManager.

**Parameters:**
- `manager` - The CoreManager instance that this ShutdownManager belongs to

## Methods

### async shutdown(): Promise<void>

Shuts down all core services in the proper order:

1. **Early Exit Check**
   - Returns immediately if the CoreManager is not initialized or already disposed

2. **Shutdown Notification**
   - Publishes the `core:shutdown` event to notify listeners

3. **Event Handler Unregistration**
   - Unregisters all event handlers through the EventHandler module

4. **Resource Disposal**
   - Disposes all tracked disposables in the CoreManager's disposables array
   - Clears the disposables array after disposal

5. **Service Shutdown**
   - Shuts down the policy guard
   - Disposes the session store if present

6. **Event Bus Cleanup**
   - Disposes the event bus to free memory

7. **State Update**
   - Marks the CoreManager as uninitialized and disposed
   - Logs completion of the shutdown process

The method is safe to call multiple times - it will only perform shutdown operations once.

## Shutdown Sequence

The shutdown follows a specific sequence to ensure proper cleanup:

1. **Notification First**
   - Publishes shutdown event before performing any disposal
   - Allows listeners to perform their own cleanup

2. **Event Handler Cleanup**
   - Unregisters event handlers to prevent processing during shutdown

3. **Resource Disposal**
   - Disposes tracked resources in reverse order of creation
   - Handles disposal errors gracefully

4. **Service Shutdown**
   - Shuts down services that require async cleanup
   - Handles service shutdown errors gracefully

5. **Memory Cleanup**
   - Disposes event bus to free memory
   - Clears references to prevent memory leaks

## Error Handling

The shutdown process includes comprehensive error handling:

- Disposal errors for individual disposables are caught and logged
- Policy guard shutdown failures are caught and logged
- Session store disposal failures are caught and logged
- Event bus disposal failures are caught and logged
- The shutdown continues even if individual steps fail

## Usage

The ShutdownManager is used internally by the CoreManager:

```typescript
import { ShutdownManager } from './ShutdownManager';

const shutdownManager = new ShutdownManager(coreManager);

// Shut down all core services
await shutdownManager.shutdown();
```

## Design Principles

1. **Ordered Shutdown**: Services are shut down in the correct order to prevent issues
2. **Idempotent Operations**: Shutdown can be called multiple times safely
3. **Error Resilience**: Individual failures don't stop the overall shutdown process
4. **Event Integration**: Properly integrates with the event system for shutdown notifications
5. **Resource Management**: Ensures all resources are properly disposed
6. **Memory Cleanup**: Frees memory by disposing event bus and clearing references
7. **Graceful Degradation**: Continues shutdown even if individual steps fail