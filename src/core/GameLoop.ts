import * as THREE from "three";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { InventoryState } from "../player/InventoryManager";
import UI from "../ui/UI";
import Engine from "./Engine";
import GameState from "./GameState";
import { Settings } from "./SettingsManager";

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
  private engine: Engine;
  private scene: THREE.Scene;

  private gameState: GameState;
  private inputController: InputController;

  private player: Player | null;
  private terrain: Terrain | null;
  private ui: UI | null;

  constructor() {
    this.engine = Engine.getInstance();
    this.gameState = GameState.getInstance();
    this.inputController = InputController.getInstance();
    this.scene = this.engine.getScene();

    this.player = null;
    this.terrain = null;
    this.ui = null;
  }

  dispose() {
    //TODO proper cleanup
    this.inputController.disable();
    this.terrain?.dispose();
    this.player?.dispose();
    this.ui?.dispose();
    this.engine.dispose();

    this.player = null;
    this.terrain = null;
    this.ui = null;
  }

  async start(gameData: GameData, settings: Settings, asyncStart: boolean) {
    this.gameState.setState("loading");

    // init scene
    this.engine.setFov(settings.fov);
    this.initLights();

    // init game entities
    this.terrain = asyncStart
      ? await this.asyncInitTerrain(gameData, settings)
      : this.initTerrain(gameData, settings);
    this.player = this.initPlayer(this.terrain, gameData);
    this.ui = this.initUI(this.player, this.terrain);

    this.gameState.setState("running");

    // enable player controls
    this.player.enableControls();

    // start game loop
    this.engine.start((dt) => {
      this.loop(dt);
    });
  }

  private loop(dt: number) {
    const { inputController, player, terrain, ui } = this;

    if (this.gameState.isRunning()) {
      terrain!.update(player!.getPosition());
      player!.update(dt);
      ui!.update();
      inputController.update(); // this must come lastly
    }
  }

  /**
   * //TODO implement a better light system (smooth lighting)
   * //TODO dispose lights
   */
  private initLights() {
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.2);
    sunLight.position.set(100, 100, 0);

    // const helper = new THREE.DirectionalLightHelper(sunLight, 5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);

    // add lights
    this.scene.add(sunLight, ambientLight);
    // this.scene.add(helper);

    // set sky color
    this.scene.background = new THREE.Color("#87CEEB");
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
    player.setSpawnOnPosition(spawn.x, spawn.z);
    player.setQuaternion(quaternion);

    return player;
  }

  private initUI(player: Player, terrain: Terrain) {
    const ui = new UI(player, terrain);

    return ui;
  }
}
