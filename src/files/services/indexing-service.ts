// src/files/services/indexing-service.ts
import * as vscode from "vscode";
import type { Logger } from "@/telemetry/logger.js";
import type { FileEntry } from "@/files/types";
import { FilesBaseService } from "./base-service";
import { DEFAULT_EXCLUDES } from "@/files/excludes";
import { toRelPath, basename, extname } from "@/files/utils";

export class IndexingService extends FilesBaseService {
  private index: FileEntry[] = [];
  private complete = false;
  private watcher: vscode.FileSystemWatcher | null = null;

  getIndex(): FileEntry[] {
    return this.index;
  }

  isComplete(): boolean {
    return this.complete;
  }

  getSummary() {
    return { indexed: this.index.length, complete: this.complete };
  }

  getIndexSlice(limit = 200): FileEntry[] {
    return this.index.slice(0, Math.max(0, limit));
  }

  async refreshIndex(): Promise<void> {
    const t0 = Date.now();
    try {
      const exclude = `{${DEFAULT_EXCLUDES.join(",")}}`;
      // Limit intentionally high; workspace.findFiles filters by glob efficiently
      const uris = await vscode.workspace.findFiles("**/*", exclude, 50000);
      const items: FileEntry[] = [];
      for (const u of uris) {
        const rp = toRelPath(u);
        if (!rp || rp.endsWith("/")) continue;
        const name = basename(rp);
        const ext = extname(rp);
        items.push({ type: "file", path: rp, name, ext });
      }
      this.index = items;
      this.complete = true;
      this.logger?.info?.("files index built", {
        count: items.length,
        ms: Date.now() - t0,
      });
    } catch (e) {
      this.logger?.error?.("files index failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      this.complete = false;
    }
  }

  setupWatcher(): void {
    try {
      const pattern = new vscode.RelativePattern(
        vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file("."),
        "**/*"
      );
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
    } catch (e) {
      this.logger?.warn?.("files watcher init failed", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  handleFileChange(u: vscode.Uri, isDelete = false): void {
    const rp = toRelPath(u);
    const name = basename(rp);
    const ext = extname(rp);
    
    if (isDelete) {
      const i = this.index.findIndex((e) => e.path === rp);
      if (i >= 0) this.index.splice(i, 1);
      return;
    }
    
    // naive: just refresh affected entry
    const idx = this.index.findIndex((e) => e.path === rp);
    if (idx >= 0) {
      const prev = this.index[idx]!;
      this.index[idx] = { ...prev, name, ext };
    } else {
      this.index.push({ type: "file", path: rp, name, ext });
    }
  }

  dispose(): void {
    this.disposed = true;
    try {
      this.watcher?.dispose();
    } catch {}
    this.watcher = null;
  }
}