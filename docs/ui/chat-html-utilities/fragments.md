# fragments.ts

Assembles HTML fragments from `media/chat/html/**` with validation and consistent ordering.

API
- `collectHtmlFiles(root: vscode.Uri): Promise<vscode.Uri[]>`
- `hasForbiddenTags(html: string): string | null`
- `htmlCommentSeparator(label: string): string`
- `readFragments(dir: vscode.Uri, logger?): Promise<{ html, injected, warnings }>`

Behavior
- Recursively collects `*.html` files; path-sorts to keep output stable.
- Rejects fragments containing `<script>` or CSP `<meta http-equiv>`; logs warnings.
- Prepends HTML comments as separators per fragment for debugging.
- Returns combined HTML and lists of injected paths + warnings.

Surface warnings
- The caller shows a banner above `messages`/`footer` when any warnings exist.

