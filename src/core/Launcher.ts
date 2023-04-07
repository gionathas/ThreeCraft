import AudioSystem from "../audio/AudioSystem";
import EnvVars from "../config/EnvVars";
import DataManager from "../io/DataManager";
import MainMenu from "../ui/MainMenu";
import Game from "./Game";
import GameLoop from "./GameLoop";
import GameState from "./GameState";
import SettingsManager from "./SettingsManager";

export default class Launcher {
  private gameState: GameState;
  private gameLoop: GameLoop;

  private audioSystem: AudioSystem;
  private dataManager: DataManager;
  private settingsManager: SettingsManager;

  // ui
  private mainMenu: MainMenu;

  constructor() {
    this.gameState = Game.instance().getState();
    this.audioSystem = Game.instance().getAudioSystem();
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

    // add click sound to all buttons
    document.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        this.audioSystem.playSound("click.ogg");
      });
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
      await this.settingsManager.loadSettings();
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
    const asyncInit = !showTerrainGeneration;

    // load saved data
    const loadedData = await this.dataManager.loadGameData();

    // load saved settings
    const settings = await this.settingsManager.loadSettings();
    this.gameLoop.run(loadedData, settings, asyncInit);
  }
}
