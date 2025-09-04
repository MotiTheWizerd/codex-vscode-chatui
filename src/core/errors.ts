// errors.ts — central error types for the extension

export class ExtensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtensionError";
  }
}

export class ConfigError extends ExtensionError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ServiceNotFoundError extends ExtensionError {
  constructor(serviceName: string) {
    super(`Service "${serviceName}" not found in container`);
    this.name = "ServiceNotFoundError";
  }
}