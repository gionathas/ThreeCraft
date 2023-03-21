type MenuScreen = "initial" | "loading" | "options" | "guide";
export default class MainMenu {
  private screen!: MenuScreen;
  private mainMenu: HTMLElement;

  private githubIcon: HTMLElement;
  private overlay: HTMLElement;

  // labels
  private title: HTMLElement;
  private loadingLabel: HTMLElement;

  // buttons
  private playBtn: HTMLElement;
  private resetBtn: HTMLElement;
  private optionsBtn: HTMLElement;
  private guideBtn: HTMLElement;

  constructor() {
    this.mainMenu = document.getElementById("main-menu")!;
    this.overlay = document.getElementById("overlay")!;
    this.githubIcon = document.getElementById("github-link-icon")!;

    // buttons
    this.playBtn = document.getElementById("play-btn")!;
    this.resetBtn = document.getElementById("reset-btn")!;
    this.optionsBtn = document.getElementById("options-btn")!;
    this.guideBtn = document.getElementById("guide-btn")!;

    // labels
    this.title = this.mainMenu.querySelector(".title")!;
    this.loadingLabel = this.mainMenu.querySelector(".loading-label")!;

    // set initial screen
    this.setMenuScreen("initial");
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

  setMenuScreen(screen: MenuScreen) {
    this.clearScreen();

    switch (screen) {
      case "initial":
        this.screen = "initial";
        this.showInitialScreen();
        break;
      case "loading":
        this.screen = "loading";
        this.showLoadingScreen();
    }
  }

  private clearScreen() {
    switch (this.screen) {
      case "initial":
        this.hideInitialScreen();
        break;
      case "loading":
        this.hideLoadingScreen();
    }
  }

  private hideInitialScreen() {
    this.playBtn.style.display = "none";
    this.resetBtn.style.display = "none";
    this.optionsBtn.style.display = "none";
    this.guideBtn.style.display = "none";
  }

  private showInitialScreen() {
    this.title.style.display = "block";

    // buttons
    this.playBtn.style.display = "block";
    this.resetBtn.style.display = "block";
    this.optionsBtn.style.display = "block";
    this.guideBtn.style.display = "block";
  }

  private hideLoadingScreen() {
    this.title.style.display = "block";
    this.loadingLabel.style.display = "none";
  }

  private showLoadingScreen() {
    this.title.style.display = "none";
    this.loadingLabel.style.display = "block";
  }

  setOnPlayWorld(callback: () => void) {
    this.playBtn.addEventListener("click", callback);
  }
}
