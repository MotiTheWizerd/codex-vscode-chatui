# Network Resiliency

- HTTP helpers: `src/transport/http.ts`
  - `withTimeout(p, ms)`
  - `retry(fn, {retries, baseMs, maxMs})`
  - `safeFetch(input, init, timeoutMs)` → wraps fetch with timeout + typed errors
- Errors: `src/telemetry/errors.ts` (`TimeoutError`, `NetworkError`, `ProtocolError`)
- Client: `src/transport/client.ts` now uses `safeFetch` + `retry`
- WebSocket: `src/transport/ws-handler.ts` with auto-reconnect + heartbeat

Example:

```ts
import { retry, safeFetch } from "@/transport/http";

const res = await retry(() => safeFetch(url, init, 10_000), { retries: 3 });
```

