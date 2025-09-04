// Secrets provider for API keys and redaction
// This file handles secure storage of API keys and other secrets

import * as vscode from 'vscode';

export class SecretsProvider {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  // Store a secret
  async storeSecret(key: string, value: string): Promise<void> {
    await this.context.secrets.store(key, value);
  }

  // Retrieve a secret
  async getSecret(key: string): Promise<string | undefined> {
    return await this.context.secrets.get(key);
  }

  // Delete a secret
  async deleteSecret(key: string): Promise<void> {
    await this.context.secrets.delete(key);
  }

  // Redact secrets from logs
  static redact(text: string): string {
    // For MVP, we'll just return a placeholder
    // In a full implementation, this would redact actual secrets
    return text.replace(/(apiKey|api_key|token)=['"][^'"]*['"]/gi, '$1=***REDACTED***');
  }
}