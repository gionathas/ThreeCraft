import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import GameDataManager from "../io/GameDataManager";
import InventoryManager from "../player/InventoryManager";
import MainMenu from "../ui/MainMenu";
import { randomString } from "../utils/helpers";
import GameLoop, { GameData } from "./GameLoop";
import GameState from "./GameState";
import SettingsManager, { Settings } from "./SettingsManager";

const newGameData: GameData = {
  world: {
    seed: EnvVars.CUSTOM_SEED ? EnvVars.CUSTOM_SEED : randomString(10),
  },
  player: {
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
  },
};
export default class Launcher {
  private gameState: GameState;
  private gameLoop: GameLoop;

  private dataManager: GameDataManager;
  private settingsManager: SettingsManager;

  // ui's
  private mainMenu: MainMenu;

  constructor() {
    this.gameState = GameState.getInstance();
    this.gameLoop = new GameLoop();

    this.dataManager = GameDataManager.getInstance();
    this.settingsManager = SettingsManager.getInstance();

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

    this.mainMenu.onPlayWorld(async () => {
      await this.loadGame();
      this.mainMenu.hide();
    });

    this.mainMenu.onResetWorld(async () => {
      await this.newGame();
      this.mainMenu.hide();
    });

    this.mainMenu.onSettings(async () => {
      await this.loadSettings();
      this.mainMenu.setMenuLayout("settings");
    });

    this.mainMenu.onSettingsApply(() => {
      this.mainMenu.setMenuLayout("main");
    });

    this.mainMenu.onGuide(() => {
      this.mainMenu.setMenuLayout("guide");
    });

    this.mainMenu.onBack(() => {
      this.mainMenu.setMenuLayout("main");
    });

    // back to main menu
    this.gameState.onMenu(() => {
      this.gameLoop.dispose();
      this.mainMenu.setMenuLayout("main");
      this.mainMenu.show();
    });

    this.gameState.onLoading(() => {
      this.mainMenu.setMenuLayout("loading");
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
    await this.dataManager.clearGameData();

    // load saved settings
    const settings = await this.loadSettings();

    if (showTerrainGeneration) {
      this.gameLoop.start(newGameData, settings, false);
    } else {
      await this.gameLoop.start(newGameData, settings, true);
    }
  }

  private async loadGame() {
    const showTerrainGeneration = EnvVars.SHOW_INITIAL_TERRAIN_GENERATION;

    // load saved data
    const loadedData = await this.loadGameData();

    // load saved settings
    const settings = await this.loadSettings();

    if (showTerrainGeneration) {
      this.gameLoop.start(loadedData, settings, false);
    } else {
      await this.gameLoop.start(loadedData, settings, true);
    }
  }

  private async loadSettings(): Promise<Settings> {
    await this.settingsManager.loadSavedSettings();
    return this.settingsManager.getSettings();
  }

  private async loadGameData(): Promise<GameData> {
    const worldData = await this.dataManager.getSavedWorldData();
    const playerData = await this.dataManager.getSavedPlayerData();
    const inventory = await this.dataManager.getSavedInventory();

    return {
      world: {
        seed: worldData?.seed ?? newGameData.world.seed,
      },
      player: {
        spawnPosition: playerData?.position
          ? new THREE.Vector3().fromArray(playerData.position)
          : newGameData.player.spawnPosition,
        quaternion: playerData?.quaternion
          ? new THREE.Quaternion().fromArray(playerData?.quaternion)
          : newGameData.player.quaternion,
        inventory: {
          hotbar: inventory?.hotbar ?? newGameData.player.inventory.hotbar,
          inventory:
            inventory?.inventory ?? newGameData.player.inventory.inventory,
        },
      },
    };
  }
}
