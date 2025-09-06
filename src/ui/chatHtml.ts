import * as vscode from "vscode";
import type { Logger } from "@/telemetry/logger";
import { getNonce, escapeHtml } from "@/ui/chat-html-utilities/security";
import type { FragmentResult } from "@/ui/chat-html-utilities/types";
import { readFragments } from "@/ui/chat-html-utilities/fragments";
import { resolveDistScripts, renderDistScriptTags } from "@/ui/chat-html-utilities/dist-scripts";
import { collectStaticAssets } from "@/ui/chat-html-utilities/assets";
import { loadTemplate, applyCsp, injectPlaceholders } from "@/ui/chat-html-utilities/template";

export async function getChatHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  logger?: Logger | null
): Promise<string> {
  const nonce = getNonce();
  const chatDir = vscode.Uri.joinPath(context.extensionUri, "media", "chat");
  try {
    // Collect static assets (CSS + classic JS)
    const { styleTags, classicScriptTags, styleCount, classicCount } = await collectStaticAssets(
      chatDir,
      webview,
      nonce
    );
    // Optionally include compiled dist scripts
    const distResolved = await resolveDistScripts(context, webview);
    logger?.info?.("chat-html: scripts", {
      dist: distResolved.length,
      classic: classicCount,
      styles: styleCount,
    });
    const distScriptTags = renderDistScriptTags(distResolved, nonce);
    const scriptTags = `${distScriptTags}\n${classicScriptTags}`;

    // Load HTML template and ensure CSP
    let html = await loadTemplate(chatDir);
    html = applyCsp(html);

    // Inject fragments
    const headDir = vscode.Uri.joinPath(chatDir, "html", "head");
    const headerDir = vscode.Uri.joinPath(chatDir, "html", "header");
    const messageDir = vscode.Uri.joinPath(chatDir, "html", "messages");
    const footerDir = vscode.Uri.joinPath(chatDir, "html", "footer");
    const headParts = await readFragments(headDir, logger);
    const headerParts = await readFragments(headerDir, logger);
    const messageParts = await readFragments(messageDir, logger);
    const footerParts = await readFragments(footerDir, logger);
    const messageWithBanner = (messageParts.warnings.length
      ? '<div class="codex-fragment-warning" role="alert">Some fragments were skipped. See logs.</div>\n'
      : "") + messageParts.html;
    const footerWithBanner = (footerParts.warnings.length
      ? '<div class="codex-fragment-warning" role="alert">Some fragments were skipped. See logs.</div>\n'
      : "") + footerParts.html;

    // Replace placeholders
    html = injectPlaceholders(html, {
      CSP_SOURCE: webview.cspSource,
      NONCE: nonce,
      STYLES: styleTags,
      SCRIPTS: scriptTags,
      HEAD_PARTS: headParts.html,
      HEADER_PARTS: headerParts.html,
      MESSAGE_PARTS: messageWithBanner,
      FOOTER_PARTS: footerWithBanner,
    });

    return html;
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    logger?.error?.("Failed to set chat HTML", { error: m });
    // minimal fallback content to show error
    return `<!DOCTYPE html><html><body><pre>Failed to load chat UI: ${escapeHtml(m)}</pre></body></html>`;
  }
}

// ----- HTML fragment helpers moved to chat-html-utilities/fragments -----
