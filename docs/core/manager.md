# Core Manager Module

## Overview

The CoreManager is the central orchestrator for the Codex extension. It initializes all core services, manages their lifecycle, and provides access to them through a dependency injection container.

## Class

### CoreManager

The main manager class that handles the lifecycle and orchestration of the extension.

## Properties

- `eventBus`: The event bus for pub/sub communication
- `configService`: The configuration service for managing settings
- `policyGuard`: The policy guard for permissions and rate limiting
- `diContainer`: The dependency injection container for service management

## Methods

### constructor()

Creates a new CoreManager instance and initializes all core services.

### async initialize(): Promise<void>

Initialize all core services:
1. Load configuration
2. Initialize the dependency injection container
3. Register all core services with the container

### getEventBus(): EventBus

Get the event bus instance.

### getConfigService(): ConfigService

Get the configuration service instance.

### getPolicyGuard(): PolicyGuard

Get the policy guard instance.

### getDIContainer(): DIContainer

Get the dependency injection container instance.

### async shutdown(): Promise<void>

Perform cleanup operations when the extension is shutting down.

## Usage

```typescript
import { CoreManager } from '@core/manager';

// Create and initialize the core manager
const coreManager = new CoreManager();
await coreManager.initialize();

// Access core services
const eventBus = coreManager.getEventBus();
const configService = coreManager.getConfigService();
const diContainer = coreManager.getDIContainer();

// Shutdown when done
await coreManager.shutdown();
```

## Service Registration

During initialization, the CoreManager registers the following services with the DI container:
- `eventBus`: The EventBus instance
- `configService`: The ConfigService instance
- `policyGuard`: The PolicyGuard instance

## Design Principles

1. **Central Orchestration**: Single point of control for core service lifecycle
2. **Dependency Management**: Uses DI container to manage service dependencies
3. **Async Initialization**: Supports async initialization of services
4. **Clean Shutdown**: Provides a method for graceful shutdown
5. **Service Access**: Provides both direct access and container access to services
6. **Extensible**: Designed to be extended with additional services as needed