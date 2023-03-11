import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import GameUI from "../entities/GameUI";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import Engine from "./Engine";

type GameState = "ready" | "loading" | "running" | "paused";

export default class GameLoop {
  private engine!: Engine;
  private scene!: THREE.Scene;

  private gameState!: GameState;

  private inputController!: InputController;
  private player!: Player;
  private terrain!: Terrain;
  private gameUI!: GameUI;

  constructor() {
    this.setGameState("ready");
  }

  start() {
    this.setGameState("loading");

    this.engine = Engine.getInstance();
    this.scene = this.engine.getScene();

    this.inputController = InputController.getInstance();
    this.initLights();
    this.initTerrain();
    this.initPlayer(this.terrain);
    this.initEventListeners(this.player);
    this.initGameUI();

    this.setGameState("running");

    this.engine.start((dt) => {
      this.loop(dt);
    });
  }

  stop() {
    const canBeStopped =
      this.gameState === "running" || this.gameState === "paused";

    if (!canBeStopped) {
      throw new Error("Game is not running!");
    }

    //TODO
    this.engine.stop();
  }

  private loop(dt: number) {
    const { inputController, player, terrain, gameUI, gameState } = this;

    if (gameState === "running") {
      terrain.update(player.getPosition());
      player.update(dt);
      gameUI.update(dt);
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

  private initEventListeners(player: Player) {
    window.addEventListener("pointerdown", (evt) => {
      /**
       * //TODO replace pointerdown with Resume click, Start Game click
       * here we want to lock the controls in 2 cases:
       * 1. After starting a new game and the world has been loaded
       * 2. After resuming the game from the pause menu
       */

      this.player.enableControls();
    });

    // game started or resumed
    player.setOnControlsEnabled(() => {
      this.gameState = "running";

      // enable input listeners
      this.inputController.enable();

      // hide start or pause menu
      const pauseMenu = document.getElementById("game-paused-menu");
      pauseMenu!.style.display = "none";
    });

    // pausing game or exiting from game
    player.setOnControlsDisabled(() => {
      this.gameState = "paused";

      // disable input listeners
      this.inputController.disable();

      // show pause menu
      const pauseMenu = document.getElementById("game-paused-menu");
      pauseMenu!.style.display = "flex";
    });
  }

  private initGameUI() {
    if (!this.gameUI) {
      this.gameUI = new GameUI(this.player, this.terrain);
    }
  }

  private setGameState(state: GameState) {
    this.gameState = state;
  }

  getGameState() {
    return this.gameState;
  }
}
