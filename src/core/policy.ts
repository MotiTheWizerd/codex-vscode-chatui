// policy.ts — minimal policy guard
import { Logger } from "@/telemetry/logger.js";

export class PolicyGuard {
  private requests = new Map<string, number[]>();
  private logger: Logger | null = null;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    // Nothing yet — placeholder for loading persisted policy configs
  }

  async shutdown(): Promise<void> {
    this.requests.clear();
  }
  isFeatureAllowed(feature: string): boolean {
    this.logger?.info(`PolicyGuard: Checking if feature "${feature}" is allowed`);
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
    this.logger?.info(
      `PolicyGuard: ${recent.length}/${limit} requests in window for "${identifier}"`
    );
    return recent.length < limit;
  }

  recordRequest(identifier: string): void {
    const now = Date.now();
    const history = this.requests.get(identifier) ?? [];
    history.push(now);
    this.requests.set(identifier, history);
    this.logger?.info(`PolicyGuard: Recorded request for "${identifier}"`);
  }
}
