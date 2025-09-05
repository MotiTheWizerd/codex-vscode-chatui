# Configuration Module

The configuration module provides centralized configuration management for the extension. It defines configuration types, loads settings, and provides a service for accessing configuration values.

## Overview

The `config.ts` file defines the configuration structure and provides the `ConfigService` class for managing application settings. It supports different configuration categories including API settings, feature flags, and telemetry configuration.

## Types

### `CodexConfig`

Configuration for the Codex API integration.

```typescript
type CodexConfig = {
  apiUrl: string;        // API endpoint URL
  apiKey: string;        // Authentication key
  model: string;         // Model identifier
  temperature: number;   // Response randomness (0-1)
  maxTokens: number;     // Maximum response length
};
```

### `FeatureFlags`

Feature toggle configuration.

```typescript
type FeatureFlags = {
  streaming: boolean;           // Enable streaming responses
  toolCalls: boolean;          // Enable tool/function calling
  sessionPersistence: boolean; // Enable session saving
};
```

### `TelemetryConfig`

Telemetry and analytics configuration.

```typescript
type TelemetryConfig = {
  enabled: boolean;  // Enable telemetry collection
  endpoint: string;  // Telemetry endpoint URL
};
```

### `AppConfig`

Complete application configuration combining all categories.

```typescript
type AppConfig = {
  codex: CodexConfig;
  features: FeatureFlags;
  telemetry: TelemetryConfig;
};
```

## API Reference

### `ConfigService`

Main configuration service class.

#### Constructor

```typescript
new ConfigService()
```

Creates a new configuration service instance with default values.

#### Methods

##### `setLogger(logger: Logger): void`

Sets the logger instance for configuration operations.

**Parameters:**
- `logger` - Logger instance for configuration logging

##### `load(): Promise<void>`

Loads configuration from sources (currently uses defaults).

**Returns:** `Promise<void>`

**Note:** Currently loads default configuration. Future implementation will merge VS Code settings.

##### `getAll(): Readonly<AppConfig>`

Returns the complete configuration object.

**Returns:** `Readonly<AppConfig>` - Immutable configuration object

##### `getCodex(): Readonly<CodexConfig>`

Returns the Codex API configuration.

**Returns:** `Readonly<CodexConfig>` - Immutable Codex configuration

##### `getFeatures(): Readonly<FeatureFlags>`

Returns the feature flags configuration.

**Returns:** `Readonly<FeatureFlags>` - Immutable feature flags

##### `getTelemetry(): Readonly<TelemetryConfig>`

Returns the telemetry configuration.

**Returns:** `Readonly<TelemetryConfig>` - Immutable telemetry configuration

##### `set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void`

Sets a configuration value by key.

**Parameters:**
- `key` - Configuration category key
- `value` - New configuration value

##### `setFeature<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): void`

Sets a specific feature flag value.

**Parameters:**
- `key` - Feature flag key
- `value` - New feature flag value

## Default Configuration

```typescript
const DEFAULT_CONFIG: AppConfig = {
  codex: {
    apiUrl: "http://localhost:8080",
    apiKey: "",
    model: "codex-default",
    temperature: 0.7,
    maxTokens: 1000,
  },
  features: {
    streaming: true,
    toolCalls: true,
    sessionPersistence: true,
  },
  telemetry: {
    enabled: true,
    endpoint: "http://localhost:8081/telemetry",
  },
};
```

## Usage Examples

### Basic Usage

```typescript
import { ConfigService } from "@/core/config";

const config = new ConfigService();
await config.load();

// Get configuration values
const apiConfig = config.getCodex();
const features = config.getFeatures();

// Update configuration
config.setFeature("streaming", false);
```

### With Logger

```typescript
import { ConfigService } from "@/core/config";
import { logger } from "@/telemetry/log";

const config = new ConfigService();
config.setLogger(logger);
await config.load();
```

## Future Enhancements

- Integration with VS Code settings API
- Configuration validation
- Hot-reloading of configuration changes
- Environment-specific configuration overrides
