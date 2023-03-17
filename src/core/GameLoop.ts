import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import UI from "../ui/UI";
import Engine from "./Engine";
import GameState from "./GameState";

export default class GameLoop {
  private engine!: Engine;
  private scene!: THREE.Scene;

  private gameState!: GameState;

  private inputController!: InputController;
  private player!: Player;
  private terrain!: Terrain;
  private UI!: UI;

  constructor() {
    this.gameState = GameState.getInstance();
  }

  start() {
    this.gameState.setState("loading");

    this.engine = Engine.getInstance();
    this.scene = this.engine.getScene();

    this.inputController = InputController.getInstance();
    this.initLights();
    this.initTerrain();
    this.initPlayer(this.terrain);
    this.initGameUI();

    this.gameState.setState("running");

    this.engine.start((dt) => {
      this.loop(dt);
    });
  }

  stop() {
    const state = this.gameState.getState();
    const canBeStopped = state === "running" || state === "paused";

    if (!canBeStopped) {
      throw new Error("Game is not running!");
    }

    //TODO
    this.engine.stop();
  }

  private loop(dt: number) {
    const { inputController, player, terrain, UI } = this;
    const state = this.gameState.getState();

    if (state === "running") {
      terrain.update(player.getPosition());
      player.update(dt);
      UI.update(dt);
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

  private initTerrain() {
    if (!this.terrain) {
      const spawn = new THREE.Vector3(0, 0, 0);

      this.terrain = new Terrain(spawn);
      this.terrain.update(spawn, true);
    }
  }

  //TODO wait terrain loading
  private initPlayer(terrain: Terrain) {
    if (!this.player) {
      this.player = new Player(terrain, EnvVars.DEFAULT_PLAYER_MODE);

      this.player.setSpawnOnPosition(0, 20);
    }
  }

  private initGameUI() {
    this.UI = new UI(this.player, this.terrain);
    this.UI.attachEventListeners();
  }
}
