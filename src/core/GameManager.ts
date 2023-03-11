import GameDataManager from "../io/GameDataManager";
import GameLoop from "./GameLoop";

export default class GameManager {
  private gameLoop: GameLoop;
  private dataManager: GameDataManager;

  constructor() {
    this.gameLoop = new GameLoop();
    this.dataManager = GameDataManager.getInstance();
  }

  async newGame() {
    await this.dataManager.clearAllData();
    this.gameLoop.start();
  }

  loadGame() {
    this.gameLoop.start();
  }
}
