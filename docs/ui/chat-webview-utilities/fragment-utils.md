# fragment-utils.ts

HTML fragment helpers used by the chat HTML builder.

- API:
  - `escapeHtml(s: string): string`
  - `collectHtmlFiles(root: vscode.Uri): Promise<vscode.Uri[]>`
  - `hasForbiddenTags(html: string): string | null`
  - `htmlCommentSeparator(label: string): string`
  - `readFragments(dir: vscode.Uri, logger?): Promise<{ html, injected, warnings }>`

Notes:
- Fragments containing `<script>` or CSP `<meta http-equiv>` are rejected and logged.
- Returned `warnings` are surfaced via a banner in the injected HTML.

