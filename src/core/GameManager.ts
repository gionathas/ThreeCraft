import * as THREE from "three";
import GameDataManager from "../io/GameDataManager";
import GameLoop, { GameData } from "./GameLoop";

const newGameData: GameData = {
  seed: "seed",
  spawnPosition: new THREE.Vector3(0, 0, 0),
  inventory: {
    hotbar: [],
    inventory: [],
  },
};
export default class GameManager {
  private gameLoop: GameLoop;
  private dataManager: GameDataManager;

  constructor() {
    this.gameLoop = new GameLoop();
    this.dataManager = GameDataManager.getInstance();
  }

  async newGame() {
    await this.dataManager.clearAllData();
    this.gameLoop.start(newGameData);
  }

  async loadGame() {
    const loadedData = await this.loadGameData();
    this.gameLoop.start(loadedData);
  }

  private async loadGameData() {
    const playerData = await this.dataManager.getSavedPlayerData();
    const inventory = await this.dataManager.getSavedInventory();

    return {
      seed: "seed",
      spawnPosition: playerData?.position
        ? new THREE.Vector3().fromArray(playerData.position)
        : newGameData.spawnPosition,
      inventory: {
        hotbar: inventory?.hotbar ?? newGameData.inventory.hotbar,
        inventory: inventory?.inventory ?? newGameData.inventory.inventory,
      },
    };
  }
}
