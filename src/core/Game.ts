import Logger from "../tools/Logger";
import GameCamera from "./GameCamera";
import GameScene from "./GameScene";
import GameState from "./GameState";
import Renderer from "./Renderer";

export default class Game {
  private static _instance: Game;

  // engine
  private renderer: Renderer;
  private scene: GameScene;
  private camera: GameCamera;
  private state: GameState;

  // services

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
    this.renderer = new Renderer();
    this.scene = new GameScene();
    this.camera = new GameCamera();
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
}
