// src/core/CoreManager/SessionManager.ts
import { CoreManager } from "./CoreManager";
import type { ChatSession } from "@/types/chat";

export class SessionManager {
  constructor(private readonly manager: CoreManager) {}

  async getOrCreateSession(): Promise<ChatSession> {
    const existing = this.manager.session?.getCurrentSession();
    if (existing) return existing;
    if (!this.manager.session) throw new Error("SessionStore not available");
    return await this.manager.session.createSession();
  }

  getCurrentSession(): ChatSession | null {
    return this.manager.session?.getCurrentSession() ?? null;
  }
}