import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { InventoryState } from "../player/InventoryManager";
import Logger from "../tools/Logger";
import UI from "../ui/UI";
import Game from "./Game";
import GameCamera from "./GameCamera";
import GameScene from "./GameScene";
import GameState from "./GameState";
import Renderer from "./Renderer";
import { Settings } from "./SettingsManager";

// TODO move this to a separate file
export type GameData = {
  world: {
    seed: string;
  };
  player: {
    spawnPosition: THREE.Vector3;
    quaternion: THREE.Quaternion;
    inventory: InventoryState;
  };
};

export default class GameLoop {
  // NOTE FPS are capped at 75, maybe make this configurable in the future
  private static readonly MAX_FPS = 75;

  private renderer: Renderer;
  private scene: GameScene;
  private camera: GameCamera;

  private gameState: GameState;
  private inputController: InputController;

  private player: Player | null;
  private terrain: Terrain | null;
  private ui: UI | null;

  constructor() {
    this.renderer = Game.instance().getRenderer();
    this.scene = Game.instance().getScene();
    this.camera = Game.instance().getCamera();
    this.gameState = Game.instance().getState();
    this.inputController = InputController.getInstance();

    this.player = null;
    this.terrain = null;
    this.ui = null;
  }

  async run(gameData: GameData, settings: Settings, asyncStart: boolean) {
    this.gameState.setState("loading");

    // init scene
    this.scene.init(settings.renderDistance);
    this.camera.setFov(settings.fov);

    // init game entities
    Logger.info("Initializing game entities...", Logger.GAME_LOOP_KEY);
    this.terrain = asyncStart
      ? await this.asyncInitTerrain(gameData, settings)
      : this.initTerrain(gameData, settings);
    this.player = this.initPlayer(this.terrain, gameData);
    this.ui = this.initUI(this.player, this.terrain);

    // lock controls
    this.player.lockControls();

    // start game loop
    this.runLoop();
  }

  private runLoop() {
    Logger.info("Starting Game Loop...", Logger.GAME_LOOP_KEY);
    this.renderer.showCanvas();

    let previousTime = performance.now();

    // fixed timestep
    const timestep = 1 / GameLoop.MAX_FPS;
    let accumulator = 0;

    this.gameState.setState("running");
    this.renderer.setAnimationLoop((time) => {
      let dt = (time - previousTime) / 1000;
      previousTime = time;

      // Track the accumulated time that hasn't been simulated yet
      accumulator += dt;

      // Simulate the total elapsed time in fixed-size chunks
      let numUpdateSteps = 0;
      while (accumulator >= timestep) {
        this.update(timestep);
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

  private update(dt: number) {
    const { inputController, player, terrain, ui } = this;

    if (this.gameState.isRunning()) {
      terrain!.update(player!.getPosition());
      player!.update(dt);
      ui!.update();
      inputController.update(); // this must come lastly
    }
  }

  private async asyncInitTerrain(gameData: GameData, settings: Settings) {
    if (this.terrain) {
      return this.terrain;
    }

    const { spawnPosition } = gameData.player;
    const { seed } = gameData.world;
    const { renderDistance } = settings;

    const terrain = new Terrain(seed, renderDistance);
    await terrain.asyncInit(spawnPosition);

    return terrain;
  }

  private initTerrain(gameData: GameData, settings: Settings) {
    if (this.terrain) {
      return this.terrain;
    }

    const { spawnPosition } = gameData.player;
    const { seed } = gameData.world;
    const { renderDistance } = settings;

    const terrain = new Terrain(seed, renderDistance);
    terrain.init(spawnPosition);

    return terrain;
  }

  private initPlayer(terrain: Terrain, gameData: GameData) {
    if (this.player) {
      return this.player;
    }

    const { spawnPosition: spawn, quaternion, inventory } = gameData.player;

    const player = new Player(terrain, inventory);
    player.setSpawnPosition(spawn.x, spawn.y, spawn.z);
    player.setQuaternion(quaternion);

    return player;
  }

  private initUI(player: Player, terrain: Terrain) {
    const ui = new UI(player, terrain);

    return ui;
  }

  dispose() {
    this.disposeEntities();
    this.disposeSceneAndCamera();
    this.disposeRenderer();
  }

  private disposeEntities() {
    // entities disposing
    Logger.info(
      "Disposing game entities...",
      Logger.GAME_LOOP_KEY,
      Logger.DISPOSE_KEY
    );
    this.inputController.disable();
    this.terrain?.dispose();
    this.player?.dispose();
    this.ui?.dispose();

    this.player = null;
    this.terrain = null;
    this.ui = null;
  }

  private disposeSceneAndCamera() {
    // scene and camera disposing
    Logger.info(
      "Disposing scene and camera...",
      Logger.GAME_LOOP_KEY,
      Logger.DISPOSE_KEY
    );
    this.scene.dispose();
    this.camera.clear();
  }

  private disposeRenderer() {
    // disposing renderer
    Logger.info(
      "Disposing renderer...",
      Logger.GAME_LOOP_KEY,
      Logger.DISPOSE_KEY
    );
    this.renderer.hideCanvas();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}
