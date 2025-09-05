// src/modules/composer/sanitize.ts
// Basic HTML sanitizer and paste helpers for the webview

const ALLOWED_TAGS = new Set([
  'B','STRONG','I','EM','U','S','CODE','PRE','BLOCKQUOTE','BR','P','DIV','SPAN','UL','OL','LI','A'
]);
const URL_ATTRS = new Set(['href','src']);

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url, 'http://x');
    const proto = u.protocol.toLowerCase();
    return proto === 'http:' || proto === 'https:' || proto === 'mailto:' || proto === 'about:' || proto === 'data:' || proto === 'file:' || proto === ':';
  } catch {
    return true;
  }
}

export function sanitizeHtml(inputHtml: string): string {
  const tpl = document.createElement('template');
  tpl.innerHTML = inputHtml;

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED' || tag === 'META' || tag === 'LINK') {
        el.remove();
        return;
      }
      if (!ALLOWED_TAGS.has(tag)) {
        const frag = document.createDocumentFragment();
        while (el.firstChild) frag.appendChild(el.firstChild);
        el.replaceWith(frag);
        return;
      }
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value || '';
        if (name.startsWith('on')) { el.removeAttribute(attr.name); continue; }
        if (name === 'style') { el.removeAttribute('style'); continue; }
        if (URL_ATTRS.has(name)) {
          if (!isSafeUrl(value) || /^javascript:/i.test(value)) { el.removeAttribute(attr.name); continue; }
        } else if (name !== 'class' && name !== 'title' && name !== 'alt') {
          el.removeAttribute(attr.name);
        }
      }
    }
    for (const c of Array.from(node.childNodes)) walk(c);
  };

  for (const n of Array.from(tpl.content.childNodes)) walk(n);
  return tpl.innerHTML;
}

// Returns sanitized HTML from clipboard, or from text as <br>-separated lines
export function normalizePasteToHtml(ev: ClipboardEvent): string | null {
  const dt = ev.clipboardData;
  if (!dt) return null;
  const html = dt.getData('text/html');
  if (html) return sanitizeHtml(html);
  const text = dt.getData('text/plain') ?? '';
  const escaped = text
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\"/g,'&quot;')
    .replace(/'/g,'&#39;');
  return escaped.replace(/\r?\n/g, '<br>');
}

// Back-compat for legacy paths
export function normalizePaste(ev: ClipboardEvent): string | null {
  const dt = ev.clipboardData;
  if (!dt) return null;
  const text = dt.getData('text/plain');
  return text ?? '';
}
