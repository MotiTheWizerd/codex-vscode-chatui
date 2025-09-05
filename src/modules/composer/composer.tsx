// src/modules/composer/composer.tsx
// React component mounting the Markdown-first composer

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { toggleBold, toggleItalic, toggleInlineCode, toggleFence, toggleQuote, toggleList } from "./markdown";
import { normalizePaste } from "./sanitize";
import { findMatches } from "./slash";
import type { Composer, ComposerEvent, ComposerOptions, SlashCommand } from "./types";

export function mountComposer(host: HTMLElement, opts: ComposerOptions): Composer {
  const listeners = new Set<(e: ComposerEvent) => void>();
  const emit = (e: ComposerEvent) => listeners.forEach((fn) => fn(e));

  const App: React.FC = () => {
    const [value, setValue] = useState(opts.initialValue ?? "");
    const [showSlash, setShowSlash] = useState(false);
    const [slashIndex, setSlashIndex] = useState(0);
    const [slashItems, setSlashItems] = useState<SlashCommand[]>(opts.slashCommands ?? []);
    const taRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { emit({ type: "change", value }); }, [value]);

    useEffect(() => {
      const el = taRef.current; if (!el) return;
      const onPaste = (ev: ClipboardEvent) => {
        const t = normalizePaste(ev);
        if (t != null) {
          ev.preventDefault();
          const start = el.selectionStart ?? value.length;
          const end = el.selectionEnd ?? value.length;
          const next = value.slice(0, start) + t + value.slice(end);
          setValue(next);
          queueMicrotask(() => { el.selectionStart = el.selectionEnd = start + t.length; });
        }
      };
      el.addEventListener("paste", onPaste as any);
      return () => el.removeEventListener("paste", onPaste as any);
    }, [value]);

    const withSel = (fn: (sel: string, el: HTMLTextAreaElement) => string) => {
      const el = taRef.current!;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const sel = value.slice(start, end);
      const nextSel = fn(sel, el);
      const newVal = value.slice(0, start) + nextSel + value.slice(end);
      setValue(newVal);
      queueMicrotask(() => { el.focus(); el.selectionStart = start; el.selectionEnd = start + nextSel.length; });
    };

    const submit = () => {
      const v = value.trim();
      if (!v) return;
      if (opts.maxLength && v.length > opts.maxLength) return; // guard
      emit({ type: "submit", value: v });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") { e.preventDefault(); submit(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); withSel((s) => toggleBold(s)); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") { e.preventDefault(); withSel((s) => toggleItalic(s)); }

      // Slash menu
      if (e.key === "/") { setShowSlash(true); setSlashIndex(0); setSlashItems(opts.slashCommands ?? []); }
      if (showSlash && ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowDown") setSlashIndex((i) => Math.min(i + 1, (slashItems.length - 1) | 0));
        if (e.key === "ArrowUp") setSlashIndex((i) => Math.max(i - 1, 0));
        if (e.key === "Escape") setShowSlash(false);
        if (e.key === "Enter" && slashItems[slashIndex]) {
          const cmd = slashItems[slashIndex];
          cmd.run({
            insert: (t) => setValue((old) => old + t),
            getValue: () => value,
            setValue: (v) => setValue(v),
          });
          setShowSlash(false);
        }
      }
    };

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      setValue(v);
      if (showSlash) {
        const lastSlash = v.lastIndexOf("/");
        if (lastSlash >= 0) {
          const q = v.slice(lastSlash);
          setSlashItems(findMatches(q, opts.slashCommands ?? []));
        } else {
          setShowSlash(false);
        }
      }
    };

    return (
      <div className="composer">
        <div className="toolbar">
          <button type="button" onClick={() => withSel((s) => toggleBold(s))}><b>B</b></button>
          <button type="button" onClick={() => withSel((s) => toggleItalic(s))}><i>I</i></button>
          <button type="button" onClick={() => withSel((s) => toggleInlineCode(s))}>`</button>
          <button type="button" onClick={() => withSel((s) => toggleFence(s))}>```</button>
          <button type="button" onClick={() => withSel((s) => toggleQuote(s))}>&gt;</button>
          <button type="button" onClick={() => withSel((s) => toggleList(s))}>•</button>
          <button type="button" onClick={submit}>Send</button>
        </div>
        <textarea
          ref={taRef}
          className="composer-textarea"
          spellCheck={false}
          placeholder={opts.placeholder ?? "Message…"}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        {showSlash && slashItems.length > 0 && (
          <div className="slash-menu">
            {slashItems.map((c, i) => (
              <div key={c.name} className={i === slashIndex ? "active" : ""}>
                <strong>/{c.name}</strong> — {c.hint}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const root = createRoot(host);
  root.render(<App />);

  return {
    getValue: () => (host.querySelector("textarea") as HTMLTextAreaElement | null)?.value ?? "",
    getAttachments: () => [],
    setValue: (v: string) => {
      const ta = host.querySelector("textarea") as HTMLTextAreaElement | null;
      if (ta) { ta.value = v; ta.dispatchEvent(new Event("input", { bubbles: true })); }
    },
    clearAttachments: () => {},
    focus: () => (host.querySelector("textarea") as HTMLTextAreaElement | null)?.focus(),
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    dispose: () => { root.unmount(); listeners.clear(); },
  };
}
