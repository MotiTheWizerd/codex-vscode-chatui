import * as vscode from "vscode";
import type { Logger } from "@/telemetry/logger.js";
import type { FragmentResult } from "@/ui/chat-html-utilities/types";

export async function collectHtmlFiles(root: vscode.Uri): Promise<vscode.Uri[]> {
  const files: vscode.Uri[] = [];
  const stack: vscode.Uri[] = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    try {
      const entries = await vscode.workspace.fs.readDirectory(dir);
      for (const [name, type] of entries) {
        const u = vscode.Uri.joinPath(dir, name);
        if (type === vscode.FileType.File && name.toLowerCase().endsWith(".html")) {
          files.push(u);
        } else if (type === vscode.FileType.Directory) {
          stack.push(u);
        }
      }
    } catch {
      // ignore; dir might not exist
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

export function hasForbiddenTags(html: string): string | null {
  const reScript = /<\s*script\b/i;
  const reCspMeta = /<\s*meta[^>]*http-equiv\s*=\s*["']content-security-policy["']/i;
  if (reScript.test(html)) return "Contains <script> tag";
  if (reCspMeta.test(html)) return "Contains CSP <meta http-equiv> tag";
  return null;
}

export function htmlCommentSeparator(label: string): string {
  return `<!-- ----- fragment separator: ${label} ----- -->`;
}

export async function readFragments(dir: vscode.Uri, logger?: Logger | null): Promise<FragmentResult> {
  const result: FragmentResult = { html: "", injected: [], warnings: [] };
  const files = await collectHtmlFiles(dir);
  if (!files.length) return result;
  const parts: string[] = [];
  for (const file of files) {
    try {
      const text = Buffer.from(await vscode.workspace.fs.readFile(file)).toString("utf8");
      const forbidden = hasForbiddenTags(text);
      const label = file.path;
      if (forbidden) {
        logger?.warn?.("fragment rejected", { file: label, reason: forbidden });
        result.warnings.push(`${label}: ${forbidden}`);
        continue;
      }
      parts.push(`${htmlCommentSeparator(label)}\n${text.trim()}`);
      result.injected.push(label);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      logger?.warn?.("fragment read error", { file: file.path, error: m });
      result.warnings.push(`${file.path}: ${m}`);
    }
  }
  if (result.injected.length) {
    logger?.info?.("fragments injected", { dir: dir.path, count: result.injected.length });
  }
  result.html = parts.join("\n");
  return result;
}

