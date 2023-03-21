import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import GameDataManager from "../io/GameDataManager";
import InventoryManager from "../player/InventoryManager";
import MainMenu from "../ui/MainMenu";
import { randomString } from "../utils/helpers";
import GameLoop, { GameData } from "./GameLoop";
import GameState from "./GameState";

const newGameData: GameData = {
  seed: EnvVars.CUSTOM_SEED ? EnvVars.CUSTOM_SEED : randomString(10),
  spawnPosition: new THREE.Vector3(0, 0, 0),
  quaternion: new THREE.Quaternion(0, 0, 0, 0),
  inventory: {
    hotbar: EnvVars.STARTING_HOTBAR_ITEMS.map((item) => {
      return { block: item, amount: InventoryManager.MAX_STACK_SIZE };
    }),
    inventory: EnvVars.STARTING_INVENTORY_ITEMS.map((item) => {
      return { block: item, amount: InventoryManager.MAX_STACK_SIZE };
    }),
  },
};
export default class Launcher {
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
    // to prevent the user from accidentally closing the tab
    window.addEventListener("beforeunload", (evt) => {
      const showAlert = EnvVars.SHOW_WINDOW_CLOSE_ALERT;
      if (this.gameState.isInGame() && showAlert) {
        // default behavior in Mozilla Firefox to prompt always the alert
        evt.preventDefault();
        // Chrome requires returnValue to be set
        evt.returnValue = "";
      }
    });

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
      this.mainMenu.setMenuScreen("initial");
      this.mainMenu.show();
    });

    this.gameState.onLoading(() => {
      this.mainMenu.setMenuScreen("loading");
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
    const showTerrainGeneration = EnvVars.SHOW_INITIAL_TERRAIN_GENERATION;

    // clear previous data
    await this.dataManager.clearAllData();

    if (showTerrainGeneration) {
      this.gameLoop.start(newGameData, false);
    } else {
      await this.gameLoop.start(newGameData, true);
    }
  }

  private async loadGame() {
    const showTerrainGeneration = EnvVars.SHOW_INITIAL_TERRAIN_GENERATION;

    // load saved data
    const loadedData = await this.loadGameData();

    if (showTerrainGeneration) {
      this.gameLoop.start(loadedData, false);
    } else {
      await this.gameLoop.start(loadedData, true);
    }
  }

  private async loadGameData(): Promise<GameData> {
    const worldData = await this.dataManager.getSavedWorldData();
    const playerData = await this.dataManager.getSavedPlayerData();
    const inventory = await this.dataManager.getSavedInventory();

    return {
      seed: worldData?.seed ?? newGameData.seed,
      spawnPosition: playerData?.position
        ? new THREE.Vector3().fromArray(playerData.position)
        : newGameData.spawnPosition,
      quaternion: playerData?.quaternion
        ? new THREE.Quaternion().fromArray(playerData?.quaternion)
        : newGameData.quaternion,
      inventory: {
        hotbar: inventory?.hotbar ?? newGameData.inventory.hotbar,
        inventory: inventory?.inventory ?? newGameData.inventory.inventory,
      },
    };
  }
}
