// src/core/CoreManager/ShutdownManager.ts
import { CoreManager } from "./CoreManager";
import { Events } from "@core/events";

export class ShutdownManager {
  constructor(private readonly manager: CoreManager) {}

  async shutdown(): Promise<void> {
    if (!this.manager.initialized || this.manager.disposed) return;
    this.manager.logInfo("CoreManager: shutting down...");

    // Notify listeners
    this.manager.eventBusInstance.publish(Events.CoreShutdown);

    // Unsubscribe event handlers registered by CoreManager
    this.manager.eventHandler.unregisterEventHandlers();

    // Dispose registered resources
    for (const d of this.manager.disposables) {
      try {
        d.dispose();
      } catch (e) {
        this.manager.logError("dispose failed", e);
      }
    }
    this.manager.disposables = [];

    // Shutdown policy guard and persist session store if present
    try {
      await this.manager.policies.shutdown();
    } catch (e) {
      this.manager.logError("policy guard shutdown failed", e);
    }
    try {
      await this.manager.session?.dispose();
    } catch (e) {
      this.manager.logError("session store dispose failed", e);
    }

    // Dispose event bus handlers map to free memory (best-effort)
    try {
      this.manager.eventBusInstance.dispose();
    } catch (e) {
      this.manager.logError("event bus dispose failed", e);
    }

    this.manager.initialized = false;
    this.manager.disposed = true;
    this.manager.logInfo("CoreManager: shutdown complete");
  }
}