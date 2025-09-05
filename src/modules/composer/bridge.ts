// src/modules/composer/bridge.ts
// Example wiring for a VS Code webview page using the composer

import { initComposer } from "./index";

// VS Code webview API
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const vscode = acquireVsCodeApi?.();

export function attachComposer() {
  const el = document.getElementById("composer");
  if (!el) throw new Error("#composer host not found");

  const composer = initComposer(el, { placeholder: "Message…" });

  composer.on((e) => {
    if (e.type === "submit") {
      vscode?.postMessage?.({ type: "user.send", text: e.value });
    }
  });

  window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (!msg) return;
    if (msg.type === "ui.setInput") composer.setValue(msg.text ?? "");
    if (msg.type === "ui.focusInput") composer.focus();
    if (msg.type === "ui.insertText") composer.setValue(composer.getValue() + (msg.text ?? ""));
  });

  return composer;
}