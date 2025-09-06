// src/modules/mentions/mentions-utilities/mentions-helpers.ts
// Helper functions for FileMentionsController

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

export function isTriggerContext(ctx: string): boolean {
  if (!ctx) return false;
  if ((/(^|\s)@\S*$/).test(ctx)) return true; // '@foo' style
  if ((/(^|\s)@\s$/).test(ctx)) return true; // '@ ' style
  return false;
}

export function extractQuery(ctx: string): string {
  const m = ctx.match(/(^|\s)@(\S*)$/);
  if (m) return (m[2] || '').toLowerCase();
  return '';
}