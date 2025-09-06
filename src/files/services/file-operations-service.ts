// src/files/services/file-operations-service.ts
import * as vscode from "vscode";
import type { Logger } from "@/telemetry/logger.js";
import type { FileEntry } from "@/files/types";
import { FilesBaseService } from "./base-service";
import { toRelPath, basename, extname } from "@/files/utils";

export class FileOperationsService extends FilesBaseService {
  constructor(logger: Logger | null = null) {
    super(logger);
  }

  async stat(path: string): Promise<FileEntry | null> {
    if (!path || path.includes("..") || /^([a-zA-Z]:\\|\\\\|\/)/.test(path))
      return null;
    try {
      const folders = vscode.workspace.workspaceFolders || [];
      for (const wf of folders) {
        const u = vscode.Uri.joinPath(wf.uri, path);
        try {
          const st = await vscode.workspace.fs.stat(u);
          const name = basename(path);
          const ext = extname(path);
          return {
            type: "file",
            path,
            name,
            ext,
            size: st.size,
            mtime: st.mtime,
          };
        } catch {}
      }
    } catch {}
    return null;
  }

  // Resolve dropped URIs/paths to workspace-relative entries (files or dirs)
  async resolveDrop(
    inputs: string[],
    limit = 200
  ): Promise<{ items: FileEntry[]; truncated: boolean; bad: string[] }> {
    const items: FileEntry[] = [];
    const bad: string[] = [];
    const seen = new Set<string>();
    const ALLOWED_SCHEMES = new Set(["file", "vscode-remote", "vscode-file"]);

    const addUri = async (u0: vscode.Uri) => {
      try {
        let u = u0;
        if (!ALLOWED_SCHEMES.has(u.scheme)) return false;
        // Normalize vscode-file to file scheme using fsPath
        if (u.scheme === "vscode-file") {
          u = vscode.Uri.file(u.fsPath);
        }
        const wf = vscode.workspace.getWorkspaceFolder(u);
        if (!wf) return false;
        const rel = toRelPath(u);
        if (!rel || rel.includes("..")) return false;
        if (seen.has(rel)) return true;
        const st = await vscode.workspace.fs.stat(u);
        const name = basename(rel);
        const ext = extname(rel);
        const type: "file" | "dir" =
          st.type & vscode.FileType.Directory ? "dir" : "file";
        const entry: FileEntry = {
          type,
          path: rel,
          name,
          ext,
          mtime: st.mtime,
        };
        if (type === "file") (entry as any).size = st.size;
        items.push(entry);
        seen.add(rel);
        return true;
      } catch {
        return false;
      }
    };

    for (const raw of inputs || []) {
      if (!raw) continue;
      const s = String(raw).trim();
      if (!s) continue;
      let ok = false;
      try {
        if (/^[a-zA-Z]+:\/\//.test(s)) {
          ok = await addUri(vscode.Uri.parse(s));
        } else if (/^(?:[a-zA-Z]:\\|\\\\|\/)/.test(s)) {
          ok = await addUri(vscode.Uri.file(s));
        }
      } catch {
        ok = false;
      }
      if (!ok) bad.push(s);
      if (items.length >= limit) break;
    }
    const truncated =
      items.length >= limit && (inputs?.length ?? 0) > items.length;
    return { items, truncated, bad };
  }

  dispose(): void {
    this.disposed = true;
  }
}