import AudioSystem from "../audio/AudioSystem";
import DataManager from "../io/DataManager";
import InputController from "../io/InputController";
import Logger from "../tools/Logger";
import GameScene from "./GameScene";
import GameState from "./GameState";
import Renderer from "./Renderer";
import SettingsManager from "./SettingsManager";

export default class Game {
  private static _instance: Game;

  //state
  private state: GameState;

  // engine
  private renderer: Renderer;
  private scene: GameScene;

  // services
  private inputController: InputController;
  private dataManager: DataManager;
  private audioSystem: AudioSystem;
  private settingsManager: SettingsManager;

  static instance(): Game {
    if (!Game._instance) {
      throw new Error("Game not initialized");
    }

    return this._instance;
  }

  static init() {
    Logger.info("Intialiazing game...", Logger.INIT_KEY);
    Game._instance = new Game();
  }

  private constructor() {
    this.state = new GameState();

    // engine
    this.renderer = new Renderer();
    this.scene = new GameScene(this.state);

    // services
    this.inputController = new InputController();
    this.dataManager = new DataManager();
    this.settingsManager = new SettingsManager(this.dataManager);
    this.audioSystem = new AudioSystem(this.scene.getCamera());
  }

  getState() {
    return this.state;
  }

  getRenderer() {
    return this.renderer;
  }

  getScene() {
    return this.scene;
  }

  getDataManager() {
    return this.dataManager;
  }

  getSettingsManager() {
    return this.settingsManager;
  }

  getInputController() {
    return this.inputController;
  }

  getAudioSystem() {
    return this.audioSystem;
  }
}
