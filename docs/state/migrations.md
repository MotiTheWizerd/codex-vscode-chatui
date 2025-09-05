# Migrations Module

## Overview

The migrations module handles data migration between different versions of the Codex extension. It ensures that stored data remains compatible as the extension evolves by providing a framework for schema upgrades and downgrades.

## Implementation Status

Implemented. The module provides a complete migration system with version tracking and migration application.

## Classes

### Migration

Interface defining the structure of a migration.

Properties:
- `version`: number - The version this migration targets
- `description`: string - Human-readable description of the migration
- `up`: function - Function to apply the migration
- `down`: function - Function to reverse the migration

### MigrationManager

Manages registration and application of migrations.

## Methods

### register(migration: Migration): void

Registers a migration with the migration manager.

Parameters:
- `migration`: The Migration object to register

### applyMigrations(currentVersion: number, targetVersion: number, data: PersistedState): PersistedState

Applies migrations to data to bring it from currentVersion to targetVersion.

Parameters:
- `currentVersion`: The current version of the data
- `targetVersion`: The target version to migrate to
- `data`: The data to migrate

Returns: The migrated data

### getLatestVersion(): number

Gets the latest version number from registered migrations.

Returns: The highest version number among registered migrations

## Data Structures

### PersistedState
```typescript
interface PersistedState {
  sessions: Record<string, PersistedChatSession>;
  currentSessionId: string | null;
}
```

### Migration
```typescript
interface Migration {
  version: number;
  description: string;
  up: (data: PersistedState) => PersistedState;
  down: (data: PersistedState) => PersistedState;
}
```

## Features

- **Version Tracking**: Maintains version information for stored data
- **Migration Registration**: Allows registration of migrations with up/down functions
- **Ordered Application**: Automatically sorts and applies migrations in version order
- **Error Handling**: Includes error handling for failed migrations
- **Backward Compatibility**: Supports both upgrading and downgrading data schemas
- **Extensibility**: Easily add new migrations as the schema evolves

## Implemented Migrations

### Version 1: Initial Schema
Description: Ensures data has the basic session structure
- Validates that sessions object exists
- Ensures currentSessionId exists

### Version 2: Add Timestamp Fields
Description: Adds timestamp fields to sessions and messages for better tracking
- Ensures all sessions have createdAt and updatedAt fields
- Ensures all messages have timestamp fields

## Design Principles

1. **Backward Compatibility**: Ensures older data can be read by newer versions
2. **Automated Migrations**: Minimizes manual intervention required for updates
3. **Safe Operations**: Provides error handling for failed migrations
4. **Version Tracking**: Maintains clear version information for stored data
5. **Extensibility**: Allows easy addition of new migrations
6. **Ordering**: Automatically applies migrations in the correct order

## Usage

```typescript
import { migrationManager } from '@state/migrations';

// Register a new migration
migrationManager.register({
  version: 3,
  description: "Add new feature flag",
  up: (data: PersistedState) => {
    // Add feature flag to sessions
    return data;
  },
  down: (data: PersistedState) => {
    // Remove feature flag from sessions
    return data;
  }
});

// Apply migrations
const migratedData = migrationManager.applyMigrations(
  currentVersion, 
  targetVersion, 
  originalData
);
```

## Integration

The migration manager is used internally by the session store to ensure data compatibility:

```typescript
// Check if migrations are needed and apply them
const currentVersion = getCurrentDataVersion();
const latestVersion = migrationManager.getLatestVersion();

if (currentVersion < latestVersion) {
  const migratedData = migrationManager.applyMigrations(
    currentVersion,
    latestVersion,
    rawData
  );
  // Save migrated data
}
```

## Source

- `src/state/migrations.ts`
- `src/types/chat.ts`