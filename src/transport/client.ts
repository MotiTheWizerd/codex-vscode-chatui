// Codex client for REST and WebSocket communication
// This file handles communication with the Codex server

import { ConfigService } from "@core/config";

export class CodexClient {
  private configService: ConfigService;
  private baseUrl: string;
  private apiKey: string;

  constructor(configService: ConfigService) {
    this.configService = configService;

    const codexConfig = this.configService.getCodex();
    this.baseUrl = codexConfig.apiUrl;
    this.apiKey = codexConfig.apiKey;
  }

  // Send a message to the Codex server
  async sendMessage(message: string, options?: any): Promise<any> {
    const url = `${this.baseUrl}/chat`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const body = JSON.stringify({
      message,
      ...options,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // For MVP, we'll just re-throw the error
      // In a full implementation, this would implement retry logic
      throw error;
    }
  }

  // Stream a response from the Codex server
  async streamResponse(
    message: string,
    onToken: (token: string) => void,
    options?: any
  ): Promise<void> {
    const url = `${this.baseUrl}/chat/stream`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const body = JSON.stringify({
      message,
      ...options,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          onToken(chunk);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      // For MVP, we'll just re-throw the error
      // In a full implementation, this would implement retry logic
      throw error;
    }
  }
}
