// src/files/services/files-service.ts
import * as vscode from "vscode";
import type { Logger } from "@/telemetry/logger.js";
import type { FileEntry } from "@/files/types";
import { FilesBaseService } from "./base-service";
import { IndexingService } from "./indexing-service";
import { SearchService } from "./search-service";
import { DirectoryService } from "./directory-service";
import { FileOperationsService } from "./file-operations-service";

export class FilesService implements vscode.Disposable {
  private indexingService: IndexingService;
  private searchService: SearchService;
  private directoryService: DirectoryService;
  private fileOperationsService: FileOperationsService;

  constructor(logger: Logger | null = null) {
    this.indexingService = new IndexingService(logger);
    this.searchService = new SearchService(logger);
    this.directoryService = new DirectoryService(logger);
    this.fileOperationsService = new FileOperationsService(logger);
  }

  async initialize(): Promise<void> {
    // Start background index build
    void this.indexingService.refreshIndex();
    // Set up watcher for changes
    this.indexingService.setupWatcher();
    
    const watcher = this.getWatcher();
    if (watcher) {
      watcher.onDidCreate((u) => this.indexingService.handleFileChange(u));
      watcher.onDidChange((u) => this.indexingService.handleFileChange(u));
      watcher.onDidDelete((u) => this.indexingService.handleFileChange(u, true));
    }
  }

  private getWatcher(): vscode.FileSystemWatcher | null {
    // This is a workaround to access the private watcher property
    // In a more complete refactoring, we would modify the IndexingService to expose this properly
    return (this.indexingService as any).watcher;
  }

  async refreshIndex(): Promise<void> {
    return this.indexingService.refreshIndex();
  }

  summary() {
    return this.indexingService.getSummary();
  }

  indexSlice(limit = 200): FileEntry[] {
    return this.indexingService.getIndexSlice(limit);
  }

  search(query: string, limit = 50): FileEntry[] {
    const index = this.indexingService.getIndex();
    return this.searchService.search(index, query, limit);
  }

  listChildren(path: string, limit = 200): FileEntry[] {
    const index = this.indexingService.getIndex();
    return this.directoryService.listChildren(index, path, limit);
  }

  async stat(path: string): Promise<FileEntry | null> {
    return this.fileOperationsService.stat(path);
  }

  async resolveDrop(
    inputs: string[],
    limit = 200
  ): Promise<{ items: FileEntry[]; truncated: boolean; bad: string[] }> {
    return this.fileOperationsService.resolveDrop(inputs, limit);
  }

  dispose(): void {
    this.indexingService.dispose();
    this.searchService.dispose();
    this.directoryService.dispose();
    this.fileOperationsService.dispose();
  }
}