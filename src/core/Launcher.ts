import { Quaternion, Vector3 } from "three";
import EnvVars from "../config/EnvVars";
import DataManager from "../io/DataManager";
import PlayerConstants from "../player/PlayerConstants";
import World from "../terrain/World";
import Logger from "../tools/Logger";
import MainMenu from "../ui/MainMenu";
import Game from "./Game";
import GameLoop, { GameData } from "./GameLoop";
import GameState from "./GameState";
import SettingsManager, { Settings } from "./SettingsManager";

export default class Launcher {
  private gameState: GameState;
  private gameLoop: GameLoop;

  private dataManager: DataManager;
  private settingsManager: SettingsManager;

  // ui
  private mainMenu: MainMenu;

  constructor() {
    this.gameState = Game.instance().getState();
    this.gameLoop = new GameLoop();

    this.dataManager = Game.instance().getDataManager();
    this.settingsManager = Game.instance().getSettingsManager();

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
      await this.startGame();
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
      this.startGame();
    } else {
      this.mainMenu.show();
    }
  }

  private async newGame() {
    // clear previous saved data
    await this.dataManager.clearGameData();
    await this.startGame();
  }

  private async startGame() {
    const showTerrainGeneration = EnvVars.SHOW_INITIAL_TERRAIN_GENERATION;

    // load saved data
    const loadedData = await this.loadGameData();

    // load saved settings
    const settings = await this.loadSettings();

    if (showTerrainGeneration) {
      this.gameLoop.run(loadedData, settings, false);
    } else {
      await this.gameLoop.run(loadedData, settings, true);
    }
  }

  private async loadSettings(): Promise<Settings> {
    Logger.info("Loading settings...", Logger.LOADING_KEY);
    await this.settingsManager.loadSettings();
    const settings = this.settingsManager.getSettings();
    Logger.debug(JSON.stringify(settings), Logger.LOADING_KEY);

    return settings;
  }

  // TODO: this method should be moved into another class
  private async loadGameData(): Promise<GameData> {
    Logger.info("Loading game data...", Logger.LOADING_KEY);
    const worldData = await this.dataManager.getWorldData();
    const playerData = await this.dataManager.getPlayerData();
    const inventoryData = await this.dataManager.getInventory();

    const seed = worldData?.seed
      ? worldData.seed
      : EnvVars.CUSTOM_SEED || World.generateSeed();

    const spawnPosition = playerData?.position
      ? new Vector3().fromArray(playerData.position)
      : PlayerConstants.DEFAULT_SPAWN_POSITION;

    const quaternion = playerData?.quaternion
      ? new Quaternion().fromArray(playerData.quaternion)
      : PlayerConstants.DEFAULT_LOOK_ROTATION;

    const inventory: GameData["player"]["inventory"] = inventoryData
      ? { hotbar: inventoryData.hotbar, inventory: inventoryData.inventory }
      : PlayerConstants.DEFAULT_INVENTORY_STATE;

    const gameData: GameData = {
      world: {
        seed,
      },
      player: {
        spawnPosition,
        quaternion,
        inventory,
      },
    };

    return gameData;
  }
}
