import { UIComponent } from "./UIComponent";

export default class PausedMenu implements UIComponent {
  public isVisible: boolean;

  // parent element
  private pausedMenu!: HTMLElement;

  // buttons
  private resumeButton!: HTMLButtonElement;
  private quitButton!: HTMLButtonElement;

  constructor() {
    this.isVisible = false;
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
  }

  onQuit(callback: () => void) {
    this.quitButton.addEventListener("click", callback);
  }

  //TODO add clear event listeners
}
