// event-bus.ts
import { Logger } from "@/telemetry/logger.js";

type EventHandler = (...args: unknown[]) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private logger: Logger | null = null;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  subscribe(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  unsubscribe(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  publish(event: string, ...args: unknown[]): void {
    const list = this.handlers.get(event);
    if (!list) return;
    for (const handler of list) {
      try {
        handler(...args);
      } catch (err) {
        this.logger?.error(`Error in event handler for "${event}"`, { error: err });
      }
    }
  }

  dispose(): void {
    this.handlers.clear();
  }
}
