// Message bus types (webview <-> extension)

export type UIToExt =
  | { type: "chat/send"; text: string; threadId?: string }
  | { type: "tool/run"; tool: string; payload: unknown };

export type ExtToUI =
  | { type: "chat/append"; id: string; role: "user" | "assistant"; text: string }
  | { type: "status"; level: "info" | "warn" | "error"; message: string };

