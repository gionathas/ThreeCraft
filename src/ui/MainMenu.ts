export default class MainMenu {
  private mainMenu: HTMLElement;
  private overlay: HTMLElement;
  private startBtn: HTMLElement;

  constructor() {
    this.mainMenu = document.getElementById("main-menu")!;
    this.overlay = document.getElementById("overlay")!;
    this.startBtn = document.getElementById("play-btn")!;
  }

  show() {
    this.mainMenu.style.display = "block";
    this.overlay.style.display = "block";
  }

  hide() {
    this.mainMenu.style.display = "none";
    this.overlay.style.display = "none";
  }

  setOnPlayWorld(callback: () => void) {
    this.startBtn.addEventListener("click", callback);
  }
}
