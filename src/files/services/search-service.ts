// src/files/services/search-service.ts
import type { FileEntry } from "@/files/types";
import { FilesBaseService } from "./base-service";
import { score } from "@/files/scoring";

export class SearchService extends FilesBaseService {
  search(index: FileEntry[], query: string, limit = 50): FileEntry[] {
    const q = (query || "").toLowerCase();
    if (!q) return index.slice(0, Math.max(0, limit));
    
    // score files by query
    const scoredFiles = index
      .map((e) => ({ e, s: score(e, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, Math.max(1, limit))
      .map((x) => ({ ...x.e, score: x.s } as FileEntry & { score?: number }));

    // derive parent directories from matched files
    const seen = new Set<string>();
    const dirEntries: FileEntry[] = [];
    for (const f of scoredFiles) {
      const parts = f.path.split('/').filter(Boolean);
      for (let i = 1; i < parts.length; i++) {
        const p = parts.slice(0, i).join('/');
        if (!seen.has(p)) {
          dirEntries.push({ type: 'dir', path: p, name: parts[i - 1]!, ext: '' });
          seen.add(p);
        }
      }
    }
    // If a query is present, only surface directories whose name contains the query
    const filteredDirs = dirEntries.filter((d) => d.name.toLowerCase().includes(q));

    // combine and sort: dirs first, then files (alpha by name)
    const combined = [...filteredDirs, ...scoredFiles.map(({ score, ...rest }) => rest)];
    combined.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return combined.slice(0, limit);
  }

  dispose(): void {
    this.disposed = true;
  }
}