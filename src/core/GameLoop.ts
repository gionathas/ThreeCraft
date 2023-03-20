import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import Player, { PlayerInventory } from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import UI from "../ui/UI";
import Engine from "./Engine";
import GameState from "./GameState";

export type GameData = {
  seed: string;
  spawnPosition: THREE.Vector3;
  inventory: PlayerInventory;
};

export default class GameLoop {
  private engine!: Engine;
  private scene!: THREE.Scene;

  private gameState!: GameState;

  private inputController!: InputController;
  private player: Player | null;
  private terrain: Terrain | null;
  private UI: UI | null;

  constructor() {
    this.engine = Engine.getInstance();
    this.gameState = GameState.getInstance();
    this.inputController = InputController.getInstance();
    this.scene = this.engine.getScene();

    this.player = null;
    this.terrain = null;
    this.UI = null;
  }

  dispose() {
    //TODO proper cleanup
    this.engine.dispose();
    this.inputController.disable();

    this.player = null;
    this.terrain = null;
    this.UI = null;
  }

  start(gameData: GameData) {
    const { seed, spawnPosition, inventory } = gameData;

    this.gameState.setState("loading");

    // init scene
    this.initLights();

    // init game entities
    this.terrain = this.initTerrain(seed, spawnPosition);
    this.player = this.initPlayer(this.terrain, spawnPosition, inventory);
    this.UI = this.initUI(this.player, this.terrain);

    // enable input controller
    this.inputController.enable();

    this.gameState.setState("running");

    // start game loop
    this.engine.start((dt) => {
      this.loop(dt);
    });
  }

  private loop(dt: number) {
    const { inputController, player, terrain, UI } = this;
    const state = this.gameState.getState();

    if (state === "running") {
      terrain!.update(player!.getPosition());
      player!.update(dt);
      UI!.update(dt);
      inputController.update(); // this must come lastly
    }
  }

  /**
   * //TODO implement a better light system (smooth lighting)
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

  private initTerrain(seed: string, spawn: THREE.Vector3) {
    if (this.terrain) {
      return this.terrain;
    }

    const terrain = new Terrain(seed, spawn);
    terrain.update(spawn, true);

    return terrain;
  }

  //TODO wait terrain loading
  private initPlayer(
    terrain: Terrain,
    spawn: THREE.Vector3,
    inventory: PlayerInventory
  ) {
    if (this.player) {
      return this.player;
    }

    const player = new Player(terrain, EnvVars.DEFAULT_PLAYER_MODE, inventory);
    player.setSpawnOnPosition(spawn.x, spawn.z);

    return player;
  }

  private initUI(player: Player, terrain: Terrain) {
    const ui = new UI(player, terrain);
    ui.enableEventListeners();

    return ui;
  }
}
