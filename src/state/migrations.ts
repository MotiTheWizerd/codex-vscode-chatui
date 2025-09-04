// Migrations for schema upgrades
// This file handles database schema migrations for the session store

import type { PersistedChatSession } from "@/types/chat";
import { log } from "@/telemetry/log";
import { serializeErr } from "@/telemetry/err";

export interface PersistedState {
  sessions: Record<string, PersistedChatSession>;
  currentSessionId: string | null;
}

export interface Migration {
  version: number;
  description: string;
  up: (data: PersistedState) => PersistedState;
  down: (data: PersistedState) => PersistedState;
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
    data: PersistedState
  ): PersistedState {
    // Find migrations to apply
    const migrationsToApply = this.migrations.filter(
      (m) => m.version > currentVersion && m.version <= targetVersion
    );

    // Apply migrations in order
    let result = data;
    for (const migration of migrationsToApply) {
      try {
        result = migration.up(result);
      } catch (error) {
        log.error(`Error applying migration`, { version: migration.version, err: serializeErr(error) });
        throw new Error(`Failed to apply migration ${migration.version}`);
      }
    }

    return result;
  }

  // Get the latest version
  getLatestVersion(): number {
    const last = this.migrations.at(-1);
    return last?.version ?? 0;
  }
}

// Create a global migration manager instance
export const migrationManager = new MigrationManager();

// Register migrations
// Initial schema migration
migrationManager.register({
  version: 1,
  description: "Initial schema",
  up: (data: PersistedState) => {
    // Ensure data has the basic structure
    if (!data.sessions) {
      data.sessions = {};
    }
    if (!data.currentSessionId) {
      data.currentSessionId = null;
    }
    return data;
  },
  down: (data: PersistedState) => data,
});

// Add timestamp migration
migrationManager.register({
  version: 2,
  description: "Add timestamp fields",
  up: (data: PersistedState) => {
    // Ensure all sessions have timestamp fields
    if (data.sessions) {
      for (const sessionId in data.sessions) {
        const session = data.sessions[sessionId];
        if (!session) {
          continue;
        }
        if (!session.createdAt) {
          session.createdAt = new Date().toISOString();
        }
        if (!session.updatedAt) {
          session.updatedAt = new Date().toISOString();
        }
        
        // Ensure all messages have timestamps
        if (session.messages) {
          for (const message of session.messages) {
            if (!message.timestamp) {
              message.timestamp = new Date().toISOString();
            }
          }
        }
      }
    }
    return data;
  },
  down: (data: PersistedState) => data,
});
