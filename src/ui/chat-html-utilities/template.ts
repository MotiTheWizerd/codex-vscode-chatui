import * as vscode from "vscode";

export async function loadTemplate(chatDir: vscode.Uri): Promise<string> {
  const indexUri = vscode.Uri.joinPath(chatDir, "index.html");
  const bytes = await vscode.workspace.fs.readFile(indexUri);
  return Buffer.from(bytes).toString("utf8");
}

export function applyCsp(html: string): string {
  return html
    .replace("script-src 'nonce-{{NONCE}}';", "script-src {{CSP_SOURCE}} 'nonce-{{NONCE}}';")
    .replace(/style-src\s+\{\{CSP_SOURCE\}\};/, "style-src {{CSP_SOURCE}} 'unsafe-inline';");
}

export function injectPlaceholders(html: string, placeholders: Record<string, string>): string {
  let out = html;
  for (const [key, value] of Object.entries(placeholders)) {
    const re = new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, "g");
    out = out.replace(re, value);
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

