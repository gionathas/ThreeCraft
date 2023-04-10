import { UIComponent } from "./UIComponent";

export default class PausedMenu implements UIComponent {
  public isVisible: boolean;

  // parent element
  private pausedMenu!: HTMLElement;

  // buttons
  private resumeButton!: HTMLButtonElement;
  private quitButton!: HTMLButtonElement;

  // callbacks
  private resumeCbs: ((e: Event) => void)[];
  private quitCbs: ((e: Event) => void)[];

  constructor() {
    this.isVisible = false;
    this.resumeCbs = [];
    this.quitCbs = [];
    this.init();
  }

  private init() {
    this.pausedMenu = document.getElementById("game-paused-menu")!;
    this.resumeButton = this.pausedMenu.querySelector(
      "#resume-btn"
    )! as HTMLButtonElement;
    this.quitButton = this.pausedMenu.querySelector(
      "#quit-btn"
    )! as HTMLButtonElement;
  }

  show() {
    this.isVisible = true;
    this.pausedMenu.style.display = "flex";
  }

  hide() {
    this.isVisible = false;
    this.pausedMenu.style.display = "none";
  }

  onResume(callback: () => void) {
    this.resumeButton.addEventListener("click", callback);
    this.resumeCbs.push(callback);
  }

  onQuit(callback: () => void) {
    this.quitButton.addEventListener("click", callback);
    this.quitCbs.push(callback);
  }

  dispose() {
    this.hide();

    // remove event listeners
    this.resumeCbs.forEach((cb) =>
      this.resumeButton.removeEventListener("click", cb)
    );
    this.quitCbs.forEach((cb) =>
      this.quitButton.removeEventListener("click", cb)
    );

    this.resumeCbs = [];
    this.quitCbs = [];
  }
}
