export default class MainMenu {
  private mainMenu: HTMLElement;

  private githubIcon: HTMLElement;
  private overlay: HTMLElement;
  private startBtn: HTMLElement;

  constructor() {
    this.mainMenu = document.getElementById("main-menu")!;
    this.overlay = document.getElementById("overlay")!;
    this.startBtn = document.getElementById("play-btn")!;
    this.githubIcon = document.getElementById("github-link-icon")!;
  }

  show() {
    this.mainMenu.style.display = "block";
    this.overlay.style.display = "block";
    this.githubIcon.style.display = "block";
  }

  hide() {
    this.mainMenu.style.display = "none";
    this.overlay.style.display = "none";
    this.githubIcon.style.display = "none";
  }

  setOnPlayWorld(callback: () => void) {
    this.startBtn.addEventListener("click", callback);
  }
}
