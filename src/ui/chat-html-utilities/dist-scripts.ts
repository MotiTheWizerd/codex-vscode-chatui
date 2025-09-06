import * as vscode from "vscode";

export async function resolveDistScripts(
  context: vscode.ExtensionContext,
  webview: vscode.Webview
): Promise<string[]> {
  const distUiDir = vscode.Uri.joinPath(context.extensionUri, "dist", "ui");
  const candidates = [
    "bridge.js",
    "elements-registry.js",
    "controllers.js",
    "renderer.js",
    "bootstrap.js",
    "composer-bootstrap.js",
  ].map((n) => vscode.Uri.joinPath(distUiDir, n));

  const existing: vscode.Uri[] = [];
  for (const u of candidates) {
    try {
      await vscode.workspace.fs.stat(u);
      existing.push(u);
    } catch {}
  }

  const toUriWithV = async (u: vscode.Uri) => {
    const stat = await vscode.workspace.fs.stat(u);
    const wuri = webview.asWebviewUri(u);
    return `${String(wuri)}?v=${stat.mtime}`;
  };

  return Promise.all(existing.map(toUriWithV));
}

export function renderDistScriptTags(urls: string[], nonce: string): string {
  return urls
    .map((src) => `<script type="module" nonce="${nonce}" src="${src}"></script>`)
    .join("\n");
}

