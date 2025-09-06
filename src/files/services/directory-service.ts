// src/files/services/directory-service.ts
import type { FileEntry } from "@/files/types";
import { FilesBaseService } from "./base-service";

export class DirectoryService extends FilesBaseService {
  listChildren(index: FileEntry[], path: string, limit = 200): FileEntry[] {
    // Allow empty string to list root; only reject null/undefined, parent traversal, or absolute-like inputs
    if (path == null || path.includes("..") || /^([a-zA-Z]:\\|\\\\|\/)/.test(path))
      return [];
    const norm = (path || "").replace(/^\/+|\/+$/g, "");
    const prefix = norm ? norm + "/" : "";
    const seen = new Set<string>();
    const out: FileEntry[] = [];
    for (const e of index) {
      if (!e.path.startsWith(prefix)) continue;
      const rest = e.path.slice(prefix.length);
      const slash = rest.indexOf("/");
      if (slash === -1) {
        if (!seen.has(e.path)) {
          out.push({ ...e });
          seen.add(e.path);
        }
      } else {
        const folder = rest.slice(0, slash);
        const p = prefix + folder;
        if (!seen.has(p)) {
          out.push({ type: "dir", path: p, name: folder, ext: "" });
          seen.add(p);
        }
      }
      if (out.length >= limit) break;
    }
    // Sort: directories first, then files; alphabetical by name
    out.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return out.slice(0, limit);
  }

  dispose(): void {
    this.disposed = true;
  }
}