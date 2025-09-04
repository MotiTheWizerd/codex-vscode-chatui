// Codex client for REST and WebSocket communication
// This file handles communication with the Codex server

import { ConfigService } from "@core/config";
import { Logger } from "@/telemetry/logger.js";

export class CodexClient {
  private configService: ConfigService;
  private baseUrl: string;
  private apiKey: string;
  private logger: Logger | null = null;

  constructor(configService: ConfigService, logger: Logger | null = null) {
    this.configService = configService;
    this.logger = logger;

    const codexConfig = this.configService.getCodex();
    this.baseUrl = codexConfig.apiUrl;
    this.apiKey = codexConfig.apiKey;
  }

  // Send a message to the Codex server with retry logic
  async sendMessage(message: string, options?: Record<string, unknown>): Promise<unknown> {
    const url = `${this.baseUrl}/chat`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const body = JSON.stringify({
      message,
      ...options,
    });

    // Retry logic with exponential backoff
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.logger?.info(`Sending message to Codex server (attempt ${attempt + 1})`, { url });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        // If this is the last attempt, re-throw the error
        if (attempt === maxRetries) {
          this.logger?.error("Error sending message to Codex server after retries", { error });
          throw error;
        }

        // For network errors or timeouts, retry with exponential backoff
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.logger?.warn(`Retrying message send in ${delay}ms`, { attempt: attempt + 1 });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // For other errors, re-throw immediately
        this.logger?.error("Non-retryable error sending message to Codex server", { error });
        throw error;
      }
    }
    
    // This should never be reached
    throw new Error("Unexpected error in sendMessage");
  }

  // Stream a response from the Codex server with timeout
  async streamResponse(
    message: string,
    onToken: (token: string) => void,
    options?: Record<string, unknown>
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
      this.logger?.info("Streaming response from Codex server", { url });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
          // Check if we've been aborted
          if (controller.signal.aborted) {
            throw new Error("Stream timeout");
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          onToken(chunk);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      this.logger?.error("Error streaming response from Codex server", { error });
      throw error;
    }
  }
}
