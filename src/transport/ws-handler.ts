// WebSocket handler for Codex communication
// This file handles WebSocket connections with the Codex server

import { ConfigService } from '../core/config.js';

export class WebSocketHandler {
  private configService: ConfigService;
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private apiKey: string;

  constructor(configService: ConfigService) {
    this.configService = configService;
    
    const codexConfig = this.configService.getCodex();
    this.baseUrl = codexConfig.apiUrl.replace('http', 'ws');
    this.apiKey = codexConfig.apiKey;
  }

  // Connect to the WebSocket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = `${this.baseUrl}/ws?api_key=${this.apiKey}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to Codex server');
        resolve();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
    });
  }

  // Send a message through the WebSocket
  sendMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    
    this.ws.send(JSON.stringify({ message }));
  }

  // Set up event handlers for WebSocket messages
  onMessage(handler: (data: any) => void): void {
    if (!this.ws) {
      throw new Error('WebSocket is not initialized');
    }
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handler(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  // Close the WebSocket connection
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}