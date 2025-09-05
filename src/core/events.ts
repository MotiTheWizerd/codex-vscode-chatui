// Centralized event names and payload types used across the extension
// Keep contracts minimal and stable. No runtime logic here.

import type { ChatSession } from "@/types/chat";

export const Events = {
  // Core lifecycle
  CoreReady: "core:ready",
  CoreShutdown: "core:shutdown",

  // Session lifecycle
  SessionRestored: "session:restored",

  // UI → Core
  UiSend: "ui:send",

  // Transport streaming
  TransportStarted: "transport:started",
  TransportToken: "transport:token",
  TransportComplete: "transport:complete",
  TransportError: "transport:error",

  // Tooling
  ToolInvoke: "tool:invoke",
  ToolResult: "tool:result",
  ToolError: "tool:error",
} as const;

export type EventName = typeof Events[keyof typeof Events];

// — Payload contracts —

export interface UiSendPayload {
  text: string;
  streaming?: boolean;
  options?: Record<string, unknown>;
}

export interface TransportStartedPayload {
  sessionId: string;
  messageId: string;
}

export interface TransportTokenPayload {
  sessionId: string;
  messageId: string;
  token: string;
}

export interface TransportCompletePayload {
  sessionId: string;
  messageId: string;
}

export interface TransportErrorPayload {
  sessionId?: string;
  messageId?: string;
  error: string;
}

export interface ToolInvokePayload {
  name: string;
  args: unknown;
}

export interface ToolResultPayload {
  name: string;
  result: unknown;
}

export interface ToolErrorPayload {
  name: string;
  error: string;
}

export interface SessionRestoredPayload {
  session: ChatSession;
  messageCount: number;
}

