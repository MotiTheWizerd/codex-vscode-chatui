# Bootstrap Module

The bootstrap module handles the extension initialization and startup sequence. It orchestrates the activation of core services, command registration, and UI setup.

## Overview

The `bootstrap.ts` file contains the main `bootstrap` function that is called when the VS Code extension is activated. It follows a specific initialization order to ensure all dependencies are properly set up.

## API Reference

### `bootstrap(context: vscode.ExtensionContext)`

Main initialization function for the extension.

**Parameters:**
- `context` - VS Code extension context for managing subscriptions and lifecycle

**Returns:** `Promise<void>`

**Initialization Sequence:**
1. Sets up logging infrastructure
2. Creates and initializes CoreManager
3. Registers core commands
4. Creates status bar components
5. Auto-opens chat panel

## Implementation Details

### Service Initialization

```typescript
// Initialize core services
const core = new CoreManager(context, logger);
context.subscriptions.push(core);
await core.initialize();
```

The CoreManager is created with the extension context and logger, then added to the subscription list for proper cleanup.

### Command Registration

```typescript
// Register commands (kept in their own module)
const disposables = registerCoreCommands(context, core);
context.subscriptions.push(...disposables);
```

Commands are registered through a separate module to keep the bootstrap focused on orchestration.

### UI Components

```typescript
// Optional: status bar button to open the Output channel
const statusItem = createLogsStatusItem();
context.subscriptions.push(statusItem);
```

Status bar items are created and registered for user interaction.

### Auto-Open Chat Panel

```typescript
// Auto-open chat panel on startup using the same command handler
try {
  await vscode.commands.executeCommand("codex.openChatPanel");
} catch (e) {
  const m = e instanceof Error ? e.message : String(e);
  logger.error("Failed to auto-open chat panel", { error: m });
}
```

The extension automatically opens the chat panel on startup, with error handling for robustness.

## Dependencies

- `@/telemetry/log` - Logging infrastructure
- `@/ext/registrations/commands` - Command registration
- `@/ui/statusbar/logs-button` - Status bar UI components
- `@/core/manager` - Core service management

## Error Handling

The bootstrap function includes error handling for the auto-open chat panel operation, ensuring that initialization failures don't prevent the extension from loading.

## Lifecycle Management

All created services and components are properly added to the extension context subscriptions, ensuring they are disposed of when the extension is deactivated.
