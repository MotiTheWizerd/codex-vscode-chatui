
// Metrics collector for events, latencies, and failures
// This file implements metrics collection for the extension

import type { Logger } from "@/telemetry/logger.js";

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string> | undefined;
  timestamp: Date;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private logger: Logger | null = null;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  // Record a metric
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      tags,
      timestamp: new Date()
    };

    this.metrics.push(metric);

    // For MVP, we'll just log the metric
    // In a full implementation, this would send metrics to a telemetry service
    this.logger?.info(`Metric recorded: ${name} = ${value}`, tags);
  }

  // Record a timing metric
  time<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.record(`${name}.duration`, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.record(`${name}.duration`, duration, { ...tags, error: 'true' });
      this.record(`${name}.error`, 1, { ...tags, error: error instanceof Error ? error.name : 'unknown' });
      throw error;
    }
  }

  // Record an event
  event(name: string, tags?: Record<string, string>): void {
    this.record(`${name}.count`, 1, tags);
  }

  // Get all metrics
  getMetrics(): Metric[] {
    return this.metrics;
  }

  // Clear metrics
  clear(): void {
    this.metrics = [];
  }
}
