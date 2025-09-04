# Dependency Injection Module

## Overview

The DI (Dependency Injection) module provides a simple dependency injection container for managing service dependencies. It allows services to be registered and retrieved by name, promoting loose coupling between components.

## Class

### DIContainer

A simple dependency injection container that supports registering and retrieving services.

## Methods

### register(name: string, service: any): void

Register a service with the container.

- `name`: The name to register the service under
- `service`: The service instance to register

### get<T>(name: string): T

Retrieve a service from the container.

- `name`: The name of the service to retrieve
- Returns: The registered service instance

Throws an error if the service is not found.

## Usage

```typescript
import { DIContainer } from '@core/di';

const diContainer = new DIContainer();

// Register services
diContainer.register('eventBus', new EventBus());
diContainer.register('configService', new ConfigService());

// Retrieve services
const eventBus = diContainer.get('eventBus');
const configService = diContainer.get('configService');
```

## Integration with CoreManager

The DIContainer is initialized and managed by the CoreManager, which registers all core services:

```typescript
// In CoreManager.initialize()
this.diContainer.register("eventBus", this.eventBus);
this.diContainer.register("configService", this.configService);
this.diContainer.register("policyGuard", this.policyGuard);
```

Other parts of the application can then access these services through the container:

```typescript
const configService = diContainer.get<ConfigService>('configService');
```

## Design Principles

1. **Simplicity**: Minimal implementation with only essential functionality
2. **Type Safety**: Generic get method for type-safe service retrieval
3. **Error Handling**: Clear error messages when services are not found
4. **No Magic**: No automatic dependency resolution or complex features
5. **Manual Registration**: Services must be explicitly registered
6. **Loose Coupling**: Promotes loose coupling between components