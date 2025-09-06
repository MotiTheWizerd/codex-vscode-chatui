// src/files/scoring.ts
import type { FileEntry } from "@/files/types";

export function score(e: FileEntry, q: string): number {
  const name = e.name.toLowerCase();
  const path = e.path.toLowerCase();
  let s = 0;
  if (name === q) s += 100;
  if (name.includes(q)) s += 50;
  // Only consider filename for matches; ignore path segments for files
  // (Directories are derived separately in search and filtered by name.)
  if (e.ext && q.startsWith(".") && e.ext === q) s += 20;
  // shorter names slightly preferred
  s += Math.max(0, 5 - Math.floor(name.length / 10));
  return s;
}