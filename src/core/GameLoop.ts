import { GameData } from "../io/DataManager";
import InputController from "../io/InputController";
import Logger from "../tools/Logger";
import Game from "./Game";
import GameCamera from "./GameCamera";
import GameScene from "./GameScene";
import GameState from "./GameState";
import Renderer from "./Renderer";
import { Settings } from "./SettingsManager";

export default class GameLoop {
  // NOTE FPS are capped at 75, maybe make this configurable in the future
  private static readonly MAX_FPS = 75;

  private renderer: Renderer;
  private scene: GameScene;
  private camera: GameCamera;

  private gameState: GameState;
  private inputController: InputController;

  constructor() {
    const game = Game.instance();
    this.renderer = game.getRenderer();
    this.scene = game.getScene();
    this.camera = game.getCamera();
    this.gameState = game.getState();
    this.inputController = game.getInputController();
  }

  async run(gameData: GameData, settings: Settings, asyncInit: boolean) {
    this.gameState.setState("loading");

    // init scene
    await this.scene.init(gameData, settings, asyncInit);
    this.scene.start();

    // start game loop
    this.renderer.showCanvas();
    this.gameState.setState("running");
    this.runLoop();
  }

  private runLoop() {
    Logger.info("Starting Game Loop...", Logger.INIT_KEY);

    let previousTime = performance.now();

    // fixed timestep
    const timestep = 1 / GameLoop.MAX_FPS;
    let accumulator = 0;

    this.renderer.setAnimationLoop((time) => {
      let dt = (time - previousTime) / 1000;
      previousTime = time;

      // Track the accumulated time that hasn't been simulated yet
      accumulator += dt;

      // Simulate the total elapsed time in fixed-size chunks
      let numUpdateSteps = 0;
      while (accumulator >= timestep) {
        this.scene.update(timestep);
        this.inputController.update(); // update input controller

        accumulator -= timestep;

        // Prevent spiral of death
        if (++numUpdateSteps >= 240) {
          console.warn("Too many update steps");
          // discard the unsimulated time
          accumulator = 0;
          break;
        }
      }

      this.renderer.render(this.scene, this.camera);
    });
  }

  dispose() {
    this.inputController.disable();
    this.disposeSceneAndCamera();
    this.disposeRenderer();
  }

  private disposeSceneAndCamera() {
    this.scene.dispose();
    this.camera.clear();
  }

  private disposeRenderer() {
    // disposing renderer
    Logger.info("Disposing renderer...", Logger.DISPOSE_KEY);
    this.renderer.hideCanvas();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}
