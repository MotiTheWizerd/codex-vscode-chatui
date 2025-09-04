# Telemetry

## Logger

- Logger class: `src/telemetry/logger.ts`
- Integrated in: `src/core/bootstrap.ts`

### Usage

The logger is integrated into the extension's bootstrap process and can be used throughout the extension lifecycle:

```ts
// In your class or function
import { Logger } from "@/telemetry/logger";

// Create an instance (typically done in bootstrap)
const logger = new Logger();

// Log messages at different levels
logger.info("This is an info message", { key: "value" });
logger.warn("This is a warning", { warningCode: 123 });
logger.error("This is an error", { errorCode: 500 });
logger.debug("This is a debug message", { debugInfo: "detailed data" });

// Show the output channel
logger.show();
```

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
