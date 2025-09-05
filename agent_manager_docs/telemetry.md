# Telemetry

## Logger

- Logger class: `src/telemetry/logger.ts`
- Singleton instance: `src/telemetry/log.ts`
- Integrated in: `src/core/bootstrap.ts`

### Usage

The logger is integrated into the extension's bootstrap process and should be used throughout the extension lifecycle. A singleton instance is provided for consistent logging across all modules:

```ts
// In your class or function
import { log as logger } from "@/telemetry/log";

// Log messages at different levels using the singleton instance
logger.info("This is an info message", { key: "value" });
logger.warn("This is a warning", { warningCode: 123 });
logger.error("This is an error", { errorCode: 500 });
logger.debug("This is a debug message", { debugInfo: "detailed data" });

// Show the output channel
logger.show();
```

All modules should use the singleton logger instance rather than creating new instances to ensure consistent logging throughout the application.

### Command

A command `codex.showLogs` is registered to show the log output channel:

```json
{
  "command": "codex.showLogs",
  "title": "Codex: Show Logs",
  "category": "Codex"
}
```

### Status Bar Item

A status bar item is also added to quickly access the logs:
- Text: "$(output) Codex Logs"
- Command: `codex.showLogs`
- Tooltip: "Open Codex log output"

Sink: VS Code `OutputChannel` (Codex). Interface stays stable if file/HTTP sinks are added later.

## Typed Errors

- Classes: `TimeoutError`, `NetworkError`, `ProtocolError` (`src/telemetry/errors.ts`)
- Usage:

```ts
import { NetworkError } from "@/telemetry/errors";
throw new NetworkError("Fetch failed", { status: 500 });
```
