// src/modules/mentions/mentions-utilities/text-utils.ts
// Simple text utility functions

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