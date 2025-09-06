// src/files/utils.ts
import * as vscode from "vscode";

export function toRelPath(u: vscode.Uri): string {
  const folders = vscode.workspace.workspaceFolders || [];
  const f = folders.find((wf) =>
    u.fsPath.toLowerCase().startsWith(wf.uri.fsPath.toLowerCase())
  );
  if (!f) return u.path.replace(/^\//, "");
  const rel = u.fsPath.slice(f.uri.fsPath.length).replace(/\\/g, "/");
  return rel.replace(/^\//, "");
}

export function basename(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx >= 0 ? p.slice(idx + 1) : p;
}

export function extname(p: string): string {
  const b = basename(p);
  const i = b.lastIndexOf(".");
  return i >= 0 ? b.slice(i) : "";
}