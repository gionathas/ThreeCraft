import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import GameDataManager from "../io/GameDataManager";
import { randomString } from "../utils/helpers";
import GameLoop, { GameData } from "./GameLoop";

const newGameData: GameData = {
  seed: EnvVars.CUSTOM_SEED ? EnvVars.CUSTOM_SEED : randomString(10),
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
    this.dataManager = GameDataManager.getInstance();
    this.gameLoop = new GameLoop();
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
    const worldData = await this.dataManager.getSavedWorldData();
    const playerData = await this.dataManager.getSavedPlayerData();
    const inventory = await this.dataManager.getSavedInventory();

    return {
      seed: worldData?.seed ?? newGameData.seed,
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
