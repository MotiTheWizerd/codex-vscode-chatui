// Type definitions for Codex transport
// This file contains type definitions for Codex communication

export interface CodexMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export interface CodexResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: Date;
  tokens?: number;
  model?: string;
}

export interface CodexStreamToken {
  id: string;
  token: string;
  finished: boolean;
}

export interface CodexConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}