import GameManager from "../core/GameManager";

export default class MainMenu {
  private gameManager: GameManager;
  private mainMenu: HTMLElement;
  private overlay: HTMLElement;
  private startBtn: HTMLElement;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;

    this.mainMenu = document.getElementById("main-menu")!;
    this.overlay = document.getElementById("overlay")!;
    this.startBtn = document.getElementById("play-btn")!;
    this.initEventHandlers();
  }

  show() {
    this.mainMenu.style.display = "block";
    this.overlay.style.display = "block";
  }

  private initEventHandlers() {
    this.startBtn.addEventListener("click", async () => {
      this.overlay.style.display = "none";
      this.mainMenu.style.display = "none";

      await this.gameManager.loadGame();
    });
  }
}
