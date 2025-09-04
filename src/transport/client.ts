// Codex client for REST and WebSocket communication
// This file handles communication with the Codex server

import { ConfigService } from "@core/config";
import { Logger } from "@/telemetry/logger.js";
import { retry, safeFetch } from "@/transport/http";
import { serializeErr } from "@/telemetry/err";
import { ProtocolError } from "@/telemetry/errors";

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

    try {
      const res = await retry(
        async () =>
          safeFetch(
            url,
            {
              method: "POST",
              headers,
              body,
            },
            30_000
          ),
        { retries: 3, baseMs: 500, maxMs: 8000 }
      );
      return await res.json();
    } catch (error) {
      this.logger?.error("sendMessage failed", {
        url,
        err: serializeErr(error),
      });
      throw error;
    }
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
      const response = await safeFetch(
        url,
        {
          method: "POST",
          headers,
          body,
        },
        60_000
      );

      if (!response.body) {
        throw new ProtocolError("Response body is null");
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
      this.logger?.error("Error streaming response from Codex server", { err: serializeErr(error) });
      throw error;
    }
  }
}
