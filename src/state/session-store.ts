// Session store for conversation and messages
// This file manages session persistence using VS Code's workspace storage

import * as vscode from 'vscode';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class SessionStore {
  private context: vscode.ExtensionContext;
  private sessions: Map<string, ChatSession> = new Map();
  private currentSessionId: string | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadSessions();
  }

  // Load sessions from storage
  private loadSessions(): void {
    const storedSessions = this.context.workspaceState.get('codex.sessions', {});
    for (const [id, session] of Object.entries(storedSessions)) {
      // Convert timestamp strings to Date objects
      const chatSession = session as any;
      chatSession.createdAt = new Date(chatSession.createdAt);
      chatSession.updatedAt = new Date(chatSession.updatedAt);
      chatSession.messages = chatSession.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      this.sessions.set(id, chatSession);
    }
    
    // Set the current session ID if it exists
    this.currentSessionId = this.context.workspaceState.get('codex.currentSessionId', null);
  }

  // Save sessions to storage
  private saveSessions(): void {
    const sessionsObj: any = {};
    for (const [id, session] of this.sessions.entries()) {
      sessionsObj[id] = session;
    }
    
    this.context.workspaceState.update('codex.sessions', sessionsObj);
    this.context.workspaceState.update('codex.currentSessionId', this.currentSessionId);
  }

  // Create a new session
  createSession(): ChatSession {
    const id = Date.now().toString();
    const session: ChatSession = {
      id,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.sessions.set(id, session);
    this.currentSessionId = id;
    this.saveSessions();
    
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
  addMessageToCurrentSession(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    if (!this.currentSessionId) {
      this.createSession();
    }
    
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No current session');
    }
    
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      ...message,
      timestamp: new Date()
    };
    
    session.messages.push(chatMessage);
    session.updatedAt = new Date();
    this.saveSessions();
    
    return chatMessage;
  }

  // Get all sessions
  getSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  // Clear the current session
  clearCurrentSession(): void {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId);
      this.currentSessionId = null;
      this.saveSessions();
    }
  }

  // Dispose method for VS Code's disposable pattern
  dispose(): void {
    // Save sessions before disposal
    this.saveSessions();
  }
}