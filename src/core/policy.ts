// policy.ts — minimal policy guard
export class PolicyGuard {
  private requests = new Map<string, number[]>();

  async initialize(): Promise<void> {
    // Nothing yet — placeholder for loading persisted policy configs
  }

  async shutdown(): Promise<void> {
    this.requests.clear();
  }
  isFeatureAllowed(feature: string): boolean {
    console.log(`PolicyGuard: Checking if feature "${feature}" is allowed`);
    return true; // MVP: allow all
  }

  isWithinRateLimit(
    identifier: string,
    limit = 100,
    windowMs = 60_000
  ): boolean {
    const now = Date.now();
    const history = this.requests.get(identifier) ?? [];
    const recent = history.filter((ts) => now - ts < windowMs);
    // prune old entries
    this.requests.set(identifier, recent);
    console.log(
      `PolicyGuard: ${recent.length}/${limit} requests in window for "${identifier}"`
    );
    return recent.length < limit;
  }

  recordRequest(identifier: string): void {
    const now = Date.now();
    const history = this.requests.get(identifier) ?? [];
    history.push(now);
    this.requests.set(identifier, history);
    console.log(`PolicyGuard: Recorded request for "${identifier}"`);
  }
}
