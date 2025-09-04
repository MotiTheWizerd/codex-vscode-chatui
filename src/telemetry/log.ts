// Minimal logger adapter singleton
// Use this for consistent structured logging across the codebase.
import { Logger } from "@/telemetry/logger.js";

export const log = new Logger();

