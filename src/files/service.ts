// src/files/service.ts
import * as vscode from 'vscode';
import type { Logger } from '@/telemetry/logger.js';
import type { FileEntry } from '@/files/types';

const DEFAULT_EXCLUDES = [
  '**/.git/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/out/**',
  '**/coverage/**',
  '**/*.map',
  '**/*.min.*',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.zip',
  '**/*.exe',
  '**/*.dll',
  '**/*.pdf',
  '**/*.mp4',
  '**/*.mov',
];

function toRelPath(u: vscode.Uri): string {
  const folders = vscode.workspace.workspaceFolders || [];
  const f = folders.find((wf) => u.fsPath.toLowerCase().startsWith(wf.uri.fsPath.toLowerCase()));
  if (!f) return u.path.replace(/^\//, '');
  const rel = u.fsPath.slice(f.uri.fsPath.length).replace(/\\/g, '/');
  return rel.replace(/^\//, '');
}

function basename(p: string): string { const idx = p.lastIndexOf('/'); return idx >= 0 ? p.slice(idx + 1) : p; }
function extname(p: string): string { const b = basename(p); const i = b.lastIndexOf('.'); return i >= 0 ? b.slice(i) : ''; }

export class FilesService implements vscode.Disposable {
  private logger: Logger | null;
  private disposed = false;
  private index: FileEntry[] = [];
  private complete = false;
  private watcher: vscode.FileSystemWatcher | null = null;

  constructor(logger: Logger | null = null) {
    this.logger = logger ?? null;
  }

  async initialize(): Promise<void> {
    // Start background index build
    void this.refreshIndex();
    // Set up watcher for changes
    try {
      const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file('.'), '**/*');
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
      const onChange = (u: vscode.Uri) => {
        const rp = toRelPath(u);
        const name = basename(rp);
        const ext = extname(rp);
        // naive: just refresh affected entry
        const idx = this.index.findIndex((e) => e.path === rp);
        if (idx >= 0) {
          const prev = this.index[idx]!;
          this.index[idx] = { ...prev, name, ext };
        } else {
          this.index.push({ type: 'file', path: rp, name, ext });
        }
      };
      this.watcher.onDidCreate(onChange);
      this.watcher.onDidChange(onChange);
      this.watcher.onDidDelete((u) => {
        const rp = toRelPath(u);
        const i = this.index.findIndex((e) => e.path === rp);
        if (i >= 0) this.index.splice(i, 1);
      });
    } catch (e) {
      this.logger?.warn?.('files watcher init failed', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  async refreshIndex(): Promise<void> {
    const t0 = Date.now();
    try {
      const exclude = `{${DEFAULT_EXCLUDES.join(',')}}`;
      // Limit intentionally high; workspace.findFiles filters by glob efficiently
      const uris = await vscode.workspace.findFiles('**/*', exclude, 50000);
      const items: FileEntry[] = [];
      for (const u of uris) {
        const rp = toRelPath(u);
        if (!rp || rp.endsWith('/')) continue;
        const name = basename(rp);
        const ext = extname(rp);
        items.push({ type: 'file', path: rp, name, ext });
      }
      this.index = items;
      this.complete = true;
      this.logger?.info?.('files index built', { count: items.length, ms: Date.now() - t0 });
    } catch (e) {
      this.logger?.error?.('files index failed', { error: e instanceof Error ? e.message : String(e) });
      this.complete = false;
    }
  }

  summary() { return { indexed: this.index.length, complete: this.complete }; }

  indexSlice(limit = 200): FileEntry[] {
    return this.index.slice(0, Math.max(0, limit));
  }

  // Simple fuzzy-ish scoring
  search(query: string, limit = 50): FileEntry[] {
    const q = (query || '').toLowerCase();
    if (!q) return this.indexSlice(limit);
    const scored = this.index.map((e) => ({ e, s: score(e, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => ({ ...x.e, score: x.s }));
    return scored;
  }

  listChildren(path: string, limit = 200): FileEntry[] {
    if (!path || path.includes('..') || /^([a-zA-Z]:\\|\\\\|\/)/.test(path)) return [];
    const norm = (path || '').replace(/^\/+|\/+$/g, '');
    const prefix = norm ? norm + '/' : '';
    const seen = new Set<string>();
    const out: FileEntry[] = [];
    for (const e of this.index) {
      if (!e.path.startsWith(prefix)) continue;
      const rest = e.path.slice(prefix.length);
      const slash = rest.indexOf('/');
      if (slash === -1) {
        if (!seen.has(e.path)) { out.push({ ...e }); seen.add(e.path); }
      } else {
        const folder = rest.slice(0, slash);
        const p = prefix + folder;
        if (!seen.has(p)) {
          out.push({ type: 'dir', path: p, name: folder, ext: '' });
          seen.add(p);
        }
      }
      if (out.length >= limit) break;
    }
    // Sort: directories first, then files; alphabetical by name
    out.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return out.slice(0, limit);
  }

  async stat(path: string): Promise<FileEntry | null> {
    if (!path || path.includes('..') || /^([a-zA-Z]:\\|\\\\|\/)/.test(path)) return null;
    try {
      const folders = vscode.workspace.workspaceFolders || [];
      for (const wf of folders) {
        const u = vscode.Uri.joinPath(wf.uri, path);
        try {
          const st = await vscode.workspace.fs.stat(u);
          const name = basename(path);
          const ext = extname(path);
          return { type: 'file', path, name, ext, size: st.size, mtime: st.mtime };
        } catch {}
      }
    } catch {}
    return null;
  }

  // Resolve dropped URIs/paths to workspace-relative entries (files or dirs)
  async resolveDrop(inputs: string[], limit = 200): Promise<{ items: FileEntry[]; truncated: boolean; bad: string[] }>{
    const items: FileEntry[] = [];
    const bad: string[] = [];
    const seen = new Set<string>();
    const ALLOWED_SCHEMES = new Set(['file', 'vscode-remote', 'vscode-file']);

    const addUri = async (u0: vscode.Uri) => {
      try {
        let u = u0;
        if (!ALLOWED_SCHEMES.has(u.scheme)) return false;
        // Normalize vscode-file to file scheme using fsPath
        if (u.scheme === 'vscode-file') {
          u = vscode.Uri.file(u.fsPath);
        }
        const wf = vscode.workspace.getWorkspaceFolder(u);
        if (!wf) return false;
        const rel = toRelPath(u);
        if (!rel || rel.includes('..')) return false;
        if (seen.has(rel)) return true;
        const st = await vscode.workspace.fs.stat(u);
        const name = basename(rel);
        const ext = extname(rel);
        const type: 'file' | 'dir' = (st.type & vscode.FileType.Directory) ? 'dir' : 'file';
        const entry: FileEntry = { type, path: rel, name, ext, mtime: st.mtime };
        if (type === 'file') (entry as any).size = st.size;
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
    const truncated = items.length >= limit && (inputs?.length ?? 0) > items.length;
    return { items, truncated, bad };
  }

  dispose(): void {
    this.disposed = true;
    try { this.watcher?.dispose(); } catch {}
    this.watcher = null;
  }
}

function score(e: FileEntry, q: string): number {
  const name = e.name.toLowerCase();
  const path = e.path.toLowerCase();
  let s = 0;
  if (name === q) s += 100;
  if (name.includes(q)) s += 50;
  if (path.includes(q)) s += 10;
  if (e.ext && q.startsWith('.') && e.ext === q) s += 20;
  // shorter names slightly preferred
  s += Math.max(0, 5 - Math.floor(name.length / 10));
  return s;
}
