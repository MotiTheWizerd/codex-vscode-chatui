// WebSocket handler for Codex communication
// This file handles WebSocket connections with the Codex server

import { ConfigService } from '@/core/config.js';
import { Logger } from '@/telemetry/logger.js';
import { log as defaultLog } from '@/telemetry/log';

export class WebSocketHandler {
  private configService: ConfigService;
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private apiKey: string;
  private logger: Logger | null = null;
  private messageHandler: ((data: unknown) => void) | null = null;
  private reconnecting = false;
  private hbTimer?: any;
  private closedByUser = false;

  constructor(configService: ConfigService, logger: Logger | null = null) {
    this.configService = configService;
    this.logger = logger;
    
    const codexConfig = this.configService.getCodex();
    this.baseUrl = codexConfig.apiUrl.replace('http', 'ws');
    this.apiKey = codexConfig.apiKey;
  }

  // Connect to the WebSocket server with reconnection logic
  async connect(attempt = 0): Promise<void> {
    const wsUrl = `${this.baseUrl}/ws?api_key=${this.apiKey}`;
    const logger = this.logger ?? defaultLog;

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(wsUrl);
        this.ws = ws;
        this.closedByUser = false;

        ws.onopen = () => {
          logger.info('ws open', { url: wsUrl });
          this.reconnecting = false;
          this.startHeartbeat();
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            this.messageHandler?.(data);
          } catch (e) {
            logger.warn('ws message parse failed', { err: String(e) });
          }
        };

        ws.onclose = () => {
          this.clearHeartbeat();
          if (this.closedByUser) {
            logger.info('ws closed by user');
            return;
          }
          const delay = Math.min(1000 * 2 ** attempt, 15000) + Math.random() * 500;
          logger.warn('ws closed, retrying', { attempt, delay });
          setTimeout(() => this.connect(attempt + 1).catch(() => {}), delay);
        };

        ws.onerror = (e) => {
          logger.error('ws error', { err: String(e) });
          ws.close(); // triggers onclose → backoff
        };
      } catch (error) {
        logger.error('Failed to create WebSocket connection', { err: String(error) });
        // trigger retry via onclose path
        setTimeout(() => this.connect(attempt + 1).catch(() => {}), 1000);
      }
    });
  }

  // Send a message through the WebSocket with error handling
  sendMessage(message: string): void {
    const logger = this.logger ?? defaultLog;
    const s = this.ws;
    if (!s || s.readyState !== s.OPEN) {
      logger.error('ws not open');
      throw new Error('WebSocket is not connected');
    }

    try {
      s.send(JSON.stringify({ message }));
    } catch (error) {
      logger.error('Error sending WebSocket message', { err: String(error) });
      throw error;
    }
  }

  // Set up event handlers for WebSocket messages
  onMessage(handler: (data: unknown) => void): void {
    this.messageHandler = handler;
    
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handler(data);
        } catch (error) {
          this.logger?.error('Error parsing WebSocket message', { error });
        }
      };
    }
  }

  // Close the WebSocket connection
  close(): void {
    if (this.ws) {
      this.closedByUser = true;
      this.clearHeartbeat();
      this.ws.close(1000, 'Normal closure'); // 1000 = Normal closure
      this.ws = null;
    }
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.hbTimer = setInterval(() => {
      try {
        this.sendMessage(JSON.stringify({ type: 'ping', ts: Date.now() }));
      } catch {
        // ignore; onclose will handle reconnect
      }
    }, 15000);
  }
  private clearHeartbeat() {
    if (this.hbTimer) clearInterval(this.hbTimer);
  }
}
