# Telemetry

- Logger: `src/telemetry/logger.ts`
- Adapter: `src/telemetry/log.ts`
- Error serializer: `src/telemetry/err.ts`

Usage:

```ts
import { log } from "@/telemetry/log";
import { serializeErr } from "@/telemetry/err";

log.info("message", { key: "value" });
log.warn("warning", { err: serializeErr(e) });
log.error("failure", { endpoint, err: serializeErr(e) });
```

Sink: VS Code `OutputChannel` (Codex). Interface stays stable if file/HTTP sinks are added later.

## Typed Errors

- Classes: `TimeoutError`, `NetworkError`, `ProtocolError` (`src/telemetry/errors.ts`)
- Usage:

```ts
import { NetworkError } from "@/telemetry/errors";
throw new NetworkError("Fetch failed", { status: 500 });
```
