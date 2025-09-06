// src/modules/mentions/mentions-utilities/mentions-core.ts
// Core controller logic for FileMentionsController

type Bridge = { 
  post: (t: string, p?: any) => void; 
  on?: (h: (m: any) => void) => () => void 
} | null;

type Disposable = { dispose(): void };

export class FileMentionsCore implements Disposable {
  protected root: HTMLElement | null = null;
  protected input: HTMLElement | null = null;
  protected popup: HTMLDivElement | null = null;
  protected visible = false;
  protected items: Array<{ path: string; type?: 'file' | 'dir' }> = [];
  protected activeIndex = 0;
  protected static readonly MAX_ROWS = 12;
  protected bridge: Bridge = null;
  protected unsub: (() => void) | null = null;
  protected lastReqId: string | null = null;
  protected lastDropReqId: string | null = null;
  protected debounceTimer: number | null = null;
  protected indexingComplete = false;
  protected windowDragOverHandler: ((e: DragEvent) => void) | null = null;
  protected windowDropHandler: ((e: DragEvent) => void) | null = null;

  // Deterministic mock dataset for Stage 1
  protected static MOCK_FILES: string[] = [
    "src/ui/chat-webview.ts",
    "src/ui/renderer.ts",
    "src/ui/controllers.ts",
    "src/ui/elements-registry.ts",
    "src/ui/composer-bootstrap.ts",
    "src/modules/composer/index.ts",
    "src/modules/composer/composer-dom.ts",
    "src/core/manager.ts",
    "src/core/events.ts",
    "media/chat/index.html",
    "media/chat/html/footer/01_footer.html",
    "media/chat/styles/input.css",
  ];

  public collectEmbeddedFiles(): string[] {
    if (!this.root) return [];
    return Array.from(this.root.querySelectorAll<HTMLElement>('.mention-chip'))
      .map((el) => el.dataset['path'] || '')
      .filter(Boolean);
  }

  public dispose() {
    if (this.input) {
      // Event listeners will be removed in the events module
    }
    if (this.popup && this.popup.parentNode) this.popup.parentNode.removeChild(this.popup);
    this.popup = null;
    this.root = null;
    this.input = null;
    try { this.unsub?.(); } catch {}
    this.unsub = null;
  }

  protected show() {
    if (!this.popup) return;
    this.visible = true;
    this.popup.classList.remove('hidden');
    // Render will be called from the UI module
  }
  
  protected hide() {
    if (!this.popup) return;
    this.visible = false;
    this.popup.classList.add('hidden');
  }
}