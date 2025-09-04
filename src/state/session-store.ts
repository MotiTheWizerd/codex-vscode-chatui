// Session store for conversation and messages
// This file manages session persistence using VS Code's workspace storage

import * as vscode from 'vscode';
import { Logger } from "@/telemetry/logger.js";
import type {
  ChatMessage,
  ChatSession,
  PersistedChatMessage,
  PersistedChatSession,
} from "@/types/chat";

export class SessionStore {
  private context: vscode.ExtensionContext;
  private sessions: Map<string, ChatSession> = new Map();
  private currentSessionId: string | null = null;
  private logger: Logger | null = null;

  constructor(context: vscode.ExtensionContext, logger: Logger | null = null) {
    this.context = context;
    this.logger = logger;
    this.loadSessions();
  }

  // Load sessions from storage
  private loadSessions(): void {
    const storedSessions = this.context.workspaceState.get<Record<string, PersistedChatSession>>('codex.sessions', {});
    for (const [id, session] of Object.entries(storedSessions)) {
      const chatSession: ChatSession = {
        id,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((m: PersistedChatMessage): ChatMessage => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        })),
      };
      this.sessions.set(id, chatSession);
    }

    // Set the current session ID if it exists
    this.currentSessionId = this.context.workspaceState.get<string | null>('codex.currentSessionId', null);
    this.logger?.info("Sessions loaded", { count: this.sessions.size });
  }

  // Save sessions to storage
  private async saveSessions(): Promise<void> {
    const sessionsObj: Record<string, PersistedChatSession> = {};
    for (const [id, session] of this.sessions.entries()) {
      sessionsObj[id] = {
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map((m): PersistedChatMessage => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        })),
      };
    }

    await this.context.workspaceState.update('codex.sessions', sessionsObj);
    await this.context.workspaceState.update('codex.currentSessionId', this.currentSessionId);
    this.logger?.info("Sessions saved", { count: this.sessions.size });
  }

  // Create a new session
  async createSession(): Promise<ChatSession> {
    const id = Date.now().toString();
    const session: ChatSession = {
      id,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.sessions.set(id, session);
    this.currentSessionId = id;
    await this.saveSessions();
    
    this.logger?.info("New session created", { sessionId: id });
    return session;
  }

  // Get the current session
  getCurrentSession(): ChatSession | null {
    if (!this.currentSessionId) {
      return null;
    }
    
    return this.sessions.get(this.currentSessionId) || null;
  }

  // Add a message to the current session
  async addMessageToCurrentSession(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    if (!this.currentSessionId) {
      await this.createSession();
    }
    
    const session = this.getCurrentSession();
    if (!session) {
      const error = new Error('No current session');
      this.logger?.error("Failed to add message - no current session", { error });
      throw error;
    }
    
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      ...message,
      timestamp: new Date()
    };
    
    session.messages.push(chatMessage);
    session.updatedAt = new Date();
    await this.saveSessions();
    
    this.logger?.info("Message added to session", { sessionId: session.id, messageId: chatMessage.id });
    return chatMessage;
  }

  // Get all sessions
  getSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  // Clear the current session
  async clearCurrentSession(): Promise<void> {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId);
      this.currentSessionId = null;
      await this.saveSessions();
      this.logger?.info("Current session cleared");
    }
  }

  // Dispose method for VS Code's disposable pattern
  async dispose(): Promise<void> {
    // Save sessions before disposal
    await this.saveSessions();
    this.logger?.info("Session store disposed");
  }
}
