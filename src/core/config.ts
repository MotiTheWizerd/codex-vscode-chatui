// Configuration service for merging workspace/user config
// This file handles configuration loading and management

import { Logger } from "@/telemetry/logger.js";

export type CodexConfig = {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export type FeatureFlags = {
  streaming: boolean;
  toolCalls: boolean;
  sessionPersistence: boolean;
};

export type TelemetryConfig = {
  enabled: boolean;
  endpoint: string;
};

export type AppConfig = {
  codex: CodexConfig;
  features: FeatureFlags;
  telemetry: TelemetryConfig;
};

const DEFAULT_CONFIG: AppConfig = {
  codex: {
    apiUrl: "http://localhost:8080",
    apiKey: "",
    model: "codex-default",
    temperature: 0.7,
    maxTokens: 1000,
  },
  features: {
    streaming: true,
    toolCalls: true,
    sessionPersistence: true,
  },
  telemetry: {
    enabled: true,
    endpoint: "http://localhost:8081/telemetry",
  },
};

export class ConfigService {
  private config: AppConfig = { ...DEFAULT_CONFIG };
  private logger: Logger | null = null;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  async load(): Promise<void> {
    // MVP: keep defaults. Later: merge VS Code settings here.
    this.config = { ...DEFAULT_CONFIG };
    this.logger?.info("ConfigService: Configuration loaded");
  }

  getAll(): Readonly<AppConfig> {
    return this.config;
  }
  getCodex(): Readonly<CodexConfig> {
    return this.config.codex;
  }
  getFeatures(): Readonly<FeatureFlags> {
    return this.config.features;
  }
  getTelemetry(): Readonly<TelemetryConfig> {
    return this.config.telemetry;
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
  }

  // Optional, tiny helper to flip one flag without replacing the whole object
  setFeature<K extends keyof FeatureFlags>(
    key: K,
    value: FeatureFlags[K]
  ): void {
    this.config.features = { ...this.config.features, [key]: value };
  }
}
