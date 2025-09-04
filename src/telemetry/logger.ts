// Structured logger
// This file implements a structured logger for the extension

import * as vscode from "vscode";

export interface LogEntry {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  metadata?: any;
}

export class Logger {
  private outputChannel: vscode.OutputChannel;
  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Codex");
  }

  // Log a debug message
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  // Log an info message
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  // Log a warning message
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  // Log an error message
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }

  // Generic log method
  private log(level: LogEntry["level"], message: string, metadata?: Record<string, unknown>): void {
    const timestamp = new Date();

    // Write to output channel
    this.outputChannel.appendLine(
      `[${timestamp.toISOString()}] ${level.toUpperCase()}: ${message}`
    );

    if (metadata) {
      this.outputChannel.appendLine(JSON.stringify(metadata, null, 2));
    }

    // In a full implementation, this would also send logs to a telemetry service
  }

  // Show the output channel
  show(): void {
    this.outputChannel.show();
  }

  // Dispose of the output channel
  dispose(): void {
    this.outputChannel.dispose();
  }
}
