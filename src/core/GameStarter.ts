import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import GameDataManager from "../io/GameDataManager";
import MainMenu from "../ui/MainMenu";
import { randomString } from "../utils/helpers";
import GameLoop, { GameData } from "./GameLoop";
import GameState from "./GameState";

const newGameData: GameData = {
  seed: EnvVars.CUSTOM_SEED ? EnvVars.CUSTOM_SEED : randomString(10),
  spawnPosition: new THREE.Vector3(0, 0, 0),
  inventory: {
    hotbar: [],
    inventory: [],
  },
};
export default class GameStarter {
  private gameState: GameState;
  private gameLoop: GameLoop;
  private dataManager: GameDataManager;

  // ui's
  private mainMenu: MainMenu;

  constructor() {
    this.gameState = GameState.getInstance();
    this.dataManager = GameDataManager.getInstance();
    this.gameLoop = new GameLoop();
    this.mainMenu = new MainMenu();
    this.initEventListeners();
  }

  private initEventListeners() {
    // to prevent the context menu from appearingt
    document.addEventListener("contextmenu", (evt) => {
      evt.preventDefault();
    });

    this.mainMenu.setOnPlayWorld(async () => {
      await this.loadGame();
      this.mainMenu.hide();
    });

    // back to main menu
    this.gameState.onMenu(() => {
      this.gameLoop.dispose();
      this.mainMenu.show();
    });

    this.gameState.onLoading(() => {
      //TODO implement loading screen
      console.log("loading");
    });
  }

  start() {
    if (EnvVars.JUMP_START) {
      this.loadGame();
    } else {
      this.mainMenu.show();
    }
  }

  private async newGame() {
    await this.dataManager.clearAllData();
    this.gameLoop.start(newGameData);
  }

  private async loadGame() {
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
