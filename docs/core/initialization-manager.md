# Initialization Manager Module

## Overview

The Initialization Manager module is responsible for initializing all core services of the CoreManager. It handles the complex initialization sequence, including configuration loading, service instantiation, dependency injection setup, and event handler registration.

## Class

### InitializationManager

A class that manages the initialization process for the CoreManager.

## Constructor

```typescript
constructor(manager: CoreManager)
```

Creates a new InitializationManager instance with a reference to the CoreManager.

**Parameters:**
- `manager` - The CoreManager instance that this InitializationManager belongs to

## Methods

### async initialize(): Promise<void>

Initializes all core services in the proper order:

1. **Configuration Loading**
   - Loads configuration using `config.load()`
   - Sets up loggers for various services if a logger is available

2. **Service Instantiation**
   - Creates SessionStore instance
   - Creates ToolBus instance
   - Creates CodexClient instance
   - Creates FilesService instance

3. **Policy Guard Initialization**
   - Initializes the policy guard after logger and config are ready

4. **Dependency Injection Setup**
   - Registers all core services with the DI container:
     - `eventBus`
     - `configService`
     - `policyGuard`
     - `context`
     - `logger` (if available)
     - `sessionStore` (if initialized)
     - `toolBus` (if initialized)
     - `codexClient` (if initialized)
     - `filesService` (if initialized)

5. **Event Handler Registration**
   - Registers runtime event handlers through the EventHandler module

6. **Initialization Completion**
   - Marks the CoreManager as initialized
   - Publishes the `core:ready` event
   - Starts file indexing in the background
   - Checks for session restoration and publishes `session:restored` event if needed

The method is idempotent - calling it multiple times will only initialize once.

## Initialization Sequence

The initialization follows a specific sequence to ensure proper dependency resolution:

1. **Pre-flight Setup**
   - Configuration loading
   - Logger setup for services

2. **Service Creation**
   - Services are created in dependency order
   - Logger-aware services receive logger instances

3. **Policy Initialization**
   - Policy guard is initialized after its dependencies are ready

4. **DI Registration**
   - Services are registered in a stable order
   - Conditional registration based on service availability

5. **Event System Setup**
   - Event handlers are registered
   - Core ready event is published

6. **Post-initialization Tasks**
   - Background file indexing starts
   - Session restoration check is performed

## Error Handling

The initialization process includes comprehensive error handling:

- Policy guard initialization failures are caught and logged
- File service initialization failures are caught and logged
- Session restoration check failures are caught and logged
- The initialization continues even if individual steps fail

## Usage

The InitializationManager is used internally by the CoreManager:

```typescript
import { InitializationManager } from './InitializationManager';

const initializationManager = new InitializationManager(coreManager);

// Initialize all core services
await initializationManager.initialize();
```

## Design Principles

1. **Ordered Initialization**: Services are initialized in the correct dependency order
2. **Idempotent Operations**: Initialization can be called multiple times safely
3. **Error Resilience**: Individual failures don't stop the overall initialization process
4. **Background Operations**: Non-critical operations run in the background
5. **Event Integration**: Properly integrates with the event system for startup notifications
6. **Dependency Injection**: Sets up the DI container with all core services
7. **Logger Integration**: Properly configures loggers for all logger-aware services