// Error reporter with extension error handling
// This file implements error reporting for the extension

import { ExtensionError } from '@core/errors';
import { MetricsCollector } from './metrics';

export class ErrorReporter {
  private metricsCollector: MetricsCollector;

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  // Report an error
  report(error: any, context?: string): void {
    let category = 'unknown';
    
    // Determine error category based on error type
    if (error instanceof ExtensionError) {
      category = error.constructor.name;
    } else if (error instanceof Error) {
      category = error.constructor.name || 'Error';
    }
    
    // Log the error
    console.error(`Error reported [${category}]:`, error.message || error, context);
    
    // Record metrics
    this.metricsCollector.event('error', {
      category,
      context: context || 'unknown'
    });
    
    // In a full implementation, this would send error reports to a telemetry service
  }

  // Report an error with custom category
  reportWithCategory(error: any, category: string, context?: string): void {
    // Log the error
    console.error(`Error reported [${category}]:`, error.message || error, context);
    
    // Record metrics
    this.metricsCollector.event('error', {
      category,
      context: context || 'unknown'
    });
    
    // In a full implementation, this would send error reports to a telemetry service
  }
}