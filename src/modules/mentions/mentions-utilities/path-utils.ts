// src/modules/mentions/mentions-utilities/path-utils.ts
// Simple path utility functions

export function basename(p: string): string {
  if (!p) return p;
  const parts = p.split('/').filter(Boolean);
  if (!parts.length) return p;
  return parts[parts.length - 1] ?? p;
}

export function dirname(p: string): string {
  if (!p) return '';
  const parts = p.split('/').filter(Boolean);
  if (parts.length <= 1) return '';
  return parts.slice(0, parts.length - 1).join('/');
}