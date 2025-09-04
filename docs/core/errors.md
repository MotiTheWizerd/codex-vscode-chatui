# Errors Module

## Overview

The errors module provides a minimal error hierarchy for the extension. It defines centralized error types that can be used throughout the application for consistent error handling.

## Classes

### ExtensionError
Base class for all extension errors. All other error classes in the extension should extend this class.

### ConfigError
Error class for configuration-related issues.

### ServiceNotFoundError
Error class for when a requested service is not found in the dependency injection container.

## Usage

```typescript
import { ConfigError, ServiceNotFoundError } from '@core/errors';

// Throwing a configuration error
throw new ConfigError('Invalid API key provided');

// Throwing a service not found error
throw new ServiceNotFoundError('DatabaseService');
```

## Design Principles

1. **Minimal Hierarchy**: Only includes the essential error types needed for the MVP.
2. **Easy to Catch**: All extension errors can be caught with a single `instanceof ExtensionError` check.
3. **Explicit Names**: Error names are set explicitly to help with debugging and logging.
4. **No Complexity**: Avoids error codes, complex hierarchies, or other features that aren't needed for the MVP.