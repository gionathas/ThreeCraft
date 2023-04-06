import DataManager from "../io/DataManager";
import Logger from "../tools/Logger";
import GameCamera from "./GameCamera";
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
  private camera: GameCamera;

  // services
  private dataManager: DataManager;
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
    this.scene = new GameScene();
    this.camera = new GameCamera();

    // services
    this.dataManager = new DataManager();
    this.settingsManager = new SettingsManager(this.dataManager);
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

  getCamera() {
    return this.camera;
  }

  getDataManager() {
    return this.dataManager;
  }

  getSettingsManager() {
    return this.settingsManager;
  }
}
