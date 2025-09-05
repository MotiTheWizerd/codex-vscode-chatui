// Error reporter with extension error handling
// This file implements error reporting for the extension

import { ExtensionError } from '@core/errors';
import { MetricsCollector } from './metrics';
import type { Logger } from "@/telemetry/logger.js";

export class ErrorReporter {
  private metricsCollector: MetricsCollector;
  private logger: Logger | null = null;

  constructor(metricsCollector: MetricsCollector, logger: Logger | null = null) {
    this.metricsCollector = metricsCollector;
    this.logger = logger;
  }

  // Report an error
  report(error: unknown, context?: string): void {
    let category = 'unknown';
    
    // Determine error category based on error type
    if (error instanceof ExtensionError) {
      category = error.constructor.name;
    } else if (error instanceof Error) {
      category = error.constructor.name || 'Error';
    }
    
    // Log the error
    this.logger?.error(`Error reported [${category}]: ${error instanceof Error ? error.message : String(error)}`, { context });
    
    // Record metrics
    this.metricsCollector.event('error', {
      category,
      context: context || 'unknown'
    });
    
    // In a full implementation, this would send error reports to a telemetry service
  }

  // Report an error with custom category
  reportWithCategory(error: unknown, category: string, context?: string): void {
    // Log the error
    this.logger?.error(`Error reported [${category}]: ${error instanceof Error ? error.message : String(error)}`, { context });
    
    // Record metrics
    this.metricsCollector.event('error', {
      category,
      context: context || 'unknown'
    });
    
    // In a full implementation, this would send error reports to a telemetry service
  }
}
