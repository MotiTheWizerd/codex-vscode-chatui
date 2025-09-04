// WebSocket handler for Codex communication
// This file handles WebSocket connections with the Codex server

import { ConfigService } from '@/core/config.js';
import { Logger } from '@/telemetry/logger.js';

export class WebSocketHandler {
  private configService: ConfigService;
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private apiKey: string;
  private logger: Logger | null = null;
  private messageHandler: ((data: unknown) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second

  constructor(configService: ConfigService, logger: Logger | null = null) {
    this.configService = configService;
    this.logger = logger;
    
    const codexConfig = this.configService.getCodex();
    this.baseUrl = codexConfig.apiUrl.replace('http', 'ws');
    this.apiKey = codexConfig.apiKey;
  }

  // Connect to the WebSocket server with reconnection logic
  async connect(): Promise<void> {
    const wsUrl = `${this.baseUrl}/ws?api_key=${this.apiKey}`;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.logger?.info('WebSocket connected to Codex server');
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          resolve();
        };
        
        this.ws.onerror = (error) => {
          this.logger?.error('WebSocket connection error', { error });
          // Don't reject immediately, wait for close event
        };
        
        this.ws.onclose = (event) => {
          this.logger?.info('WebSocket connection closed', { 
            code: event.code, 
            reason: event.reason 
          });
          
          // Try to reconnect if this wasn't a clean close
          if (event.code !== 1000) { // 1000 = Normal closure
            this.handleReconnect().catch(reject);
          } else {
            reject(new Error('WebSocket closed normally'));
          }
        };
        
        // Reattach message handler if we had one
        if (this.messageHandler) {
          this.ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.messageHandler?.(data);
            } catch (error) {
              this.logger?.error('Error parsing WebSocket message', { error });
            }
          };
        }
      } catch (error) {
        this.logger?.error('Failed to create WebSocket connection', { error });
        reject(error);
      }
    });
  }
  
  // Handle reconnection logic
  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger?.error('Max reconnect attempts reached, giving up');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    this.logger?.info(`Attempting to reconnect in ${delay}ms`, { 
      attempt: this.reconnectAttempts 
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
      this.logger?.info('WebSocket reconnected successfully');
    } catch (error) {
      this.logger?.error('WebSocket reconnection failed', { error });
      // Try again
      this.handleReconnect().catch(() => {
        this.logger?.error('Failed to reconnect after multiple attempts');
      });
    }
  }

  // Send a message through the WebSocket with error handling
  sendMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const error = new Error('WebSocket is not connected');
      this.logger?.error('Cannot send message', { error });
      throw error;
    }
    
    try {
      this.ws.send(JSON.stringify({ message }));
    } catch (error) {
      this.logger?.error('Error sending WebSocket message', { error });
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
      this.ws.close(1000, 'Normal closure'); // 1000 = Normal closure
      this.ws = null;
    }
  }
}