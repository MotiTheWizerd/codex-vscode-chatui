// src/modules/composer/types.ts

export type ComposerAttachment = {
  kind: 'image';
  name: string;
  type: string; // mime
  size: number;
  dataUrl: string; // data:image/...;base64,...
};

export type ComposerEvent =
  | { type: "change"; value: string; attachments?: ComposerAttachment[] }
  | { type: "submit"; value: string; attachments?: ComposerAttachment[] }
  | { type: "command"; name: string; args?: any };

export interface SlashCommand {
  name: string;
  hint: string;
  run: (ctx: { insert: (t: string) => void; getValue: () => string; setValue: (v: string) => void }) => void;
}

export interface ComposerOptions {
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  slashCommands?: SlashCommand[];
}

export interface Composer {
  getValue(): string;
  getAttachments(): ComposerAttachment[];
  setValue(v: string): void;
  clearAttachments(): void;
  focus(): void;
  on(fn: (e: ComposerEvent) => void): () => void; // unsubscribe
  dispose(): void;
}
