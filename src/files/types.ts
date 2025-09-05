// src/files/types.ts
export type FileEntry = {
  type: 'file' | 'dir';
  path: string; // workspace-relative with forward slashes
  name: string;
  ext: string;
  size?: number;
  mtime?: number;
  score?: number;
};

export type FilesResult = {
  type: 'files/result';
  op: 'index' | 'search' | 'listChildren' | 'stat' | 'resolveDrop';
  items: FileEntry[];
  cursor: string | null;
  meta: { indexed: number; complete: boolean; took_ms: number; warnings: string[] };
  reqId?: string;
};
