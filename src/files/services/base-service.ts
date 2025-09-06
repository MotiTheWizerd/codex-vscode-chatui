// src/files/services/base-service.ts
import type { Logger } from "@/telemetry/logger.js";
import type { FileEntry } from "@/files/types";

export abstract class FilesBaseService {
  protected logger: Logger | null;
  protected disposed = false;

  constructor(logger: Logger | null = null) {
    this.logger = logger ?? null;
  }

  abstract dispose(): void;
}