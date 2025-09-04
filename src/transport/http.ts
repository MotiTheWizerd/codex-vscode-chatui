import { NetworkError, ProtocolError, TimeoutError } from "@/telemetry/errors.js";

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new TimeoutError(ms)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        res(v);
      },
      (e) => {
        clearTimeout(t);
        rej(e);
      }
    );
  });
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseMs?: number; maxMs?: number } = {}
): Promise<T> {
  const { retries = 3, baseMs = 250, maxMs = 4000 } = opts;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      const backoff = Math.min(maxMs, baseMs * 2 ** attempt);
      const jitter = Math.random() * backoff * 0.2;
      await new Promise((r) => setTimeout(r, backoff + jitter));
      attempt++;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  throw lastErr;
}

export async function safeFetch(input: RequestInfo, init?: RequestInit, timeoutMs = 10000) {
  return withTimeout(fetch(input, init), timeoutMs)
    .catch((e) => {
      throw new NetworkError("fetch failed", e);
    })
    .then(async (r) => {
      if (!r.ok) throw new ProtocolError(`HTTP ${r.status} ${r.statusText}`);
      return r;
    });
}

