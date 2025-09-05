// Minimal logger adapter singleton
// Use this for consistent structured logging across the codebase.
// Import in a way that tolerates either named or default export
import * as L from "@/telemetry/logger.js";

const LoggerCtor: any = (L as any).Logger ?? (L as any).default;
export const log = new LoggerCtor();
