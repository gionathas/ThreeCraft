export default class PausedMenu {
  public isVisible: boolean;
  private pausedMenu!: HTMLElement;

  // buttons
  private resumeButton!: HTMLButtonElement;
  private quitButton!: HTMLButtonElement;

  constructor() {
    this.isVisible = false;
    this.init();
  }

  private init() {
    const pausedMenu = document.getElementById("game-paused-menu");
    const resumeBtn = document.getElementById("resume-btn");
    const exitBtn = document.getElementById("quit-btn");

    if (!pausedMenu || !resumeBtn || !exitBtn) {
      throw new Error("Paused menu invalid markup!");
    }

    this.pausedMenu = pausedMenu;
    this.resumeButton = resumeBtn as HTMLButtonElement;
    this.quitButton = exitBtn as HTMLButtonElement;
  }

  show() {
    this.isVisible = true;
    this.pausedMenu.style.display = "flex";
  }

  hide() {
    this.isVisible = false;
    this.pausedMenu.style.display = "none";
  }

  setOnResumeClick(callback: () => void) {
    this.resumeButton.addEventListener("click", callback);
  }

  setOnQuitClick(callback: () => void) {
    this.quitButton.addEventListener("click", callback);
  }

  //TODO add clear event listeners
}
