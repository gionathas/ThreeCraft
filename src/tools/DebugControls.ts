import GUI from "lil-gui";

export default class DebugControls extends GUI {
  private static instance: DebugControls | null;

  private constructor() {
    super();

    this.hide();
    const isDev = import.meta.env.DEV;

    // allowed in dev mode only
    if (!isDev) {
      this.destroy();
    }
  }

  public static getInstance(): DebugControls {
    if (!this.instance) {
      this.instance = new DebugControls();
    }
    return this.instance;
  }

  dispose() {
    this.destroy();
    DebugControls.instance = null;
  }
}
