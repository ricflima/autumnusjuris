declare global {
  interface Document {
    fullscreenElement: Element | null;
    documentElement: HTMLElement;
    exitFullscreen(): Promise<void>;
  }
  
  interface HTMLElement {
    requestFullscreen(): Promise<void>;
  }
}

export {};