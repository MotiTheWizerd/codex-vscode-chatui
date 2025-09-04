# Architecture Overview

## Module Structure

The Codex extension is organized into the following modules:

1. **core/** - Fundamental building blocks (errors, event bus, policy, config, DI, manager)
2. **config/** - Configuration handling (settings, secrets)
3. **telemetry/** - Logging, metrics, and error reporting
4. **state/** - State management (session store, migrations)
5. **tools/** - Tool integration (tool bus, shell tool)
6. **transport/** - Communication layer (client, WebSocket handler)
7. **ui/** - User interface (chat webview, renderer)
8. **ext/** - Extension entry point (activation flow)

## Core Module Dependencies

The core module forms the foundation for all other modules:

```
errors ← event-bus ← manager
  ↑         ↑         ↑
policy ← config ← di ← manager
  ↑         ↑         ↑
  └─────────┴─────────┘
```

All other modules depend on the core module services.

## Data Flow

1. **Extension Activation**: The extension.ts file initializes the CoreManager
2. **Service Initialization**: CoreManager initializes all core services and registers them in the DI container
3. **Component Communication**: Components use the EventBus for pub/sub communication
4. **Configuration Management**: All components access configuration through ConfigService
5. **Policy Enforcement**: Components check permissions and rate limits through PolicyGuard
6. **External Communication**: Transport layer handles communication with external services
7. **User Interface**: UI components provide the user experience
8. **State Management**: State module manages persistent data
9. **Telemetry**: Telemetry module collects and reports usage data

## Key Design Principles

1. **Dependency Injection**: Services are accessed through the DI container to promote loose coupling
2. **Event-Driven**: Components communicate through the EventBus to maintain loose coupling
3. **Configuration-Driven**: Behavior is controlled through configuration rather than hardcoding
4. **Policy Enforcement**: Access control and rate limiting are enforced consistently
5. **Error Handling**: Centralized error types for consistent error handling
6. **Extensibility**: Modular design allows for easy extension with new features