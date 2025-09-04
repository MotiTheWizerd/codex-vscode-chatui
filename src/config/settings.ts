// Settings manager for workspace/user scopes
// This file handles configuration settings for the extension

import * as vscode from 'vscode';

export class SettingsManager {
  // Overloads to mirror VS Code API
  static get<T>(section: string): T | undefined;
  static get<T>(section: string, defaultValue: T): T;

  // Get a configuration value
  static get<T>(section: string, defaultValue?: T): T | undefined {
    const config = vscode.workspace.getConfiguration('codex');
    return defaultValue === undefined
      ? config.get<T>(section)
      : config.get<T>(section, defaultValue);
  }

  // Update a configuration value
  static async update(section: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
    const config = vscode.workspace.getConfiguration('codex');
    await config.update(section, value, target);
  }

  // Get all configuration values
  static getAll(): any {
    const config = vscode.workspace.getConfiguration('codex');
    return config;
  }
}