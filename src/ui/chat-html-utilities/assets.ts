import * as vscode from "vscode";

export interface StaticAssetsResult {
  styleTags: string;
  classicScriptTags: string;
  styleCount: number;
  classicCount: number;
}

export async function collectStaticAssets(
  chatDir: vscode.Uri,
  webview: vscode.Webview,
  nonce: string
): Promise<StaticAssetsResult> {
  const entries = await vscode.workspace.fs.readDirectory(chatDir);

  const rootCss = entries
    .filter(([n, t]) => t === vscode.FileType.File && n.endsWith(".css"))
    .map(([n]) => vscode.Uri.joinPath(chatDir, n));
  const rootJs = entries
    .filter(([n, t]) => t === vscode.FileType.File && n.endsWith(".js"))
    .map(([n]) => vscode.Uri.joinPath(chatDir, n));

  // Optional subfolders: styles/ and js/
  const stylesDir = vscode.Uri.joinPath(chatDir, "styles");
  const jsDir = vscode.Uri.joinPath(chatDir, "js");
  const cssUris: vscode.Uri[] = [...rootCss];
  const jsUris: vscode.Uri[] = [...rootJs];
  try {
    const stylesEntries = await vscode.workspace.fs.readDirectory(stylesDir);
    for (const [n, t] of stylesEntries) {
      if (t === vscode.FileType.File && n.endsWith(".css")) {
        cssUris.push(vscode.Uri.joinPath(stylesDir, n));
      }
    }
  } catch {}
  try {
    const jsEntries = await vscode.workspace.fs.readDirectory(jsDir);
    for (const [n, t] of jsEntries) {
      if (t === vscode.FileType.File && n.endsWith(".js")) {
        jsUris.push(vscode.Uri.joinPath(jsDir, n));
      }
    }
  } catch {}

  // sort alphabetically by path
  cssUris.sort((a, b) => a.path.localeCompare(b.path));
  jsUris.sort((a, b) => a.path.localeCompare(b.path));

  const toUriWithV = async (u: vscode.Uri) => {
    const stat = await vscode.workspace.fs.stat(u);
    const wuri = webview.asWebviewUri(u);
    return `${String(wuri)}?v=${stat.mtime}`;
  };

  const styleHrefs = await Promise.all(cssUris.map(toUriWithV));
  const scriptSrcs = await Promise.all(jsUris.map(toUriWithV));

  const styleTags = styleHrefs.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n");
  const classicScriptTags = scriptSrcs
    .map((src) => `<script nonce="${nonce}" src="${src}"></script>`) // classic scripts
    .join("\n");

  return {
    styleTags,
    classicScriptTags,
    styleCount: cssUris.length,
    classicCount: jsUris.length,
  };
}

