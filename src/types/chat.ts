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

// Persisted shapes used in workspaceState
export interface PersistedChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO
}

export interface PersistedChatSession {
  id: string;
  messages: PersistedChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PersistedState {
  sessions: Record<string, PersistedChatSession>;
  currentSessionId: string | null;
}
