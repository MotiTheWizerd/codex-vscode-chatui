// src/modules/mentions/mentions-utilities/mentions-dnd.ts
// Drag and drop functionality for FileMentionsController

import { FileMentionsBridge } from "@/modules/mentions/mentions-utilities/mentions-bridge";

export class FileMentionsDnD extends FileMentionsBridge {
  protected installDnD() {
    if (!this.input) return;
    const container = this.root || this.input;

    const isSupported = (dt: DataTransfer | null): boolean => {
      if (!dt) return false;
      const types = Array.from(dt.types || []);
      return types.includes('text/uri-list') || types.includes('text/plain');
    };

    const handleDragOver = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (!dt) return;
      // Always prevent default to avoid browser navigation
      e.preventDefault();
      e.stopPropagation();
      if (isSupported(dt)) {
        try { dt.dropEffect = 'copy'; } catch {}
        container.classList.add('drop-target');
      }
    };

    const handleDragEnter = (e: DragEvent) => {
      e.stopPropagation();
      container.classList.add('drop-target');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.stopPropagation();
      container.classList.remove('drop-target');
    };

    const handleDrop = (e: DragEvent) => {
      const dt = e.dataTransfer;
      container.classList.remove('drop-target');
      if (!dt) return;
      if (!isSupported(dt)) return;
      const inputs: string[] = [];
      const uriList = dt.getData('text/uri-list');
      if (uriList) inputs.push(...uriList.split(/\r?\n/).filter(Boolean));
      else {
        const plain = dt.getData('text/plain');
        if (plain) inputs.push(plain);
      }
      if (inputs.length) {
        e.preventDefault();
        e.stopPropagation();
        this.requestDrop(inputs);
      }
    };

    // Attach to both input and container to catch drops on padding/margins
    const targets: HTMLElement[] = [];
    targets.push(this.input);
    if (container !== this.input) targets.push(container);
    for (const t of targets) {
      t.addEventListener('dragover', handleDragOver, { capture: true });
      t.addEventListener('dragenter', handleDragEnter, { capture: true });
      t.addEventListener('dragleave', handleDragLeave, { capture: true });
      t.addEventListener('drop', handleDrop, { capture: true });
    }

    // Window and document-level suppression to avoid VS Code default open on drop
    const windowDragOver = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling so drop doesn't open files/folders
      e.preventDefault();
      e.stopPropagation();
    };
    const windowDrop = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling
      e.preventDefault();
      e.stopPropagation();
    };
    const docDragOver = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling so drop doesn't open files/folders
      e.preventDefault();
      e.stopPropagation();
    };
    const docDrop = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling
      e.preventDefault();
      e.stopPropagation();
    };
    // Use passive: false to ensure we can call preventDefault()
    window.addEventListener('dragover', windowDragOver, { capture: true, passive: false });
    window.addEventListener('drop', windowDrop, { capture: true, passive: false });
    document.addEventListener('dragover', docDragOver, { capture: true, passive: false });
    document.addEventListener('drop', docDrop, { capture: true, passive: false });

    // Store references so we can remove them later
    this.windowDragOverHandler = windowDragOver;
    this.windowDropHandler = windowDrop;
  }

  public override dispose() {
    if (this.input) {
      // Event listener removal would go here
    }
    if (this.windowDragOverHandler) {
      window.removeEventListener('dragover', this.windowDragOverHandler, { capture: true });
      window.removeEventListener('drop', this.windowDropHandler!, { capture: true });
    }
    super.dispose();
  }
}
