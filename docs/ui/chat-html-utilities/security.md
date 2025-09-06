# security.ts

Helpers for security-sensitive operations used by the chat HTML builder.

API
- `getNonce(): string` — 32-char random ASCII nonce for CSP script tags.
- `escapeHtml(s: string): string` — Escapes `& < > " '`. Used in fallback error content.

Notes
- Nonce is generated once per HTML build in `getChatHtml`.
- Do not use the nonce for anything other than CSP-bound script tags.

