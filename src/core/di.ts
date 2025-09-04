export class DIContainer {
  private services = new Map<string, unknown>();

  register<T>(name: string, service: T, overwrite = false): void {
    if (!overwrite && this.services.has(name)) {
      throw new Error(`Service "${name}" is already registered`);
    }
    this.services.set(name, service);
  }

  resolve<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service "${name}" not found in container`);
    }
    return this.services.get(name) as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}
