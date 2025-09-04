// src/ext/extension.ts
import type * as vscode from "vscode";
import { bootstrap } from "@/core/bootstrap";

export async function activate(context: vscode.ExtensionContext) {
  await bootstrap(context);
}

export function deactivate() {}
