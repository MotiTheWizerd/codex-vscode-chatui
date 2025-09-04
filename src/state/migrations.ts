// Migrations for schema upgrades
// This file handles database schema migrations for the session store

export interface Migration {
  version: number;
  description: string;
  up: (data: any) => any;
  down: (data: any) => any;
}

export class MigrationManager {
  private migrations: Migration[] = [];

  // Register a migration
  register(migration: Migration): void {
    this.migrations.push(migration);
    // Sort migrations by version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  // Apply migrations to data
  applyMigrations(
    currentVersion: number,
    targetVersion: number,
    data: any
  ): any {
    // For MVP, we'll just return the data as-is
    // In a full implementation, this would apply the necessary migrations

    // Find migrations to apply
    const migrationsToApply = this.migrations.filter(
      (m) => m.version > currentVersion && m.version <= targetVersion
    );

    // Apply migrations in order
    let result = data;
    for (const migration of migrationsToApply) {
      result = migration.up(result);
    }

    return result;
  }

  // Get the latest version
  // Get the latest version
  getLatestVersion(): number {
    const last = this.migrations.at(-1);
    return last?.version ?? 0;
  }
}

// Create a global migration manager instance
export const migrationManager = new MigrationManager();

// Register migrations
// For MVP, we'll register a single migration for the initial schema
migrationManager.register({
  version: 1,
  description: "Initial schema",
  up: (data: any) => data,
  down: (data: any) => data,
});
