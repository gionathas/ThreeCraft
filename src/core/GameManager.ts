import * as THREE from "three";
import { AmbientLight } from "three";
import { DEFAULT_PLAYER_MODE } from "../config/constants";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import DebugUI from "../ui/DebugUI";
import Engine from "./Engine";

type GameState = "running" | "paused" | "main-menu";

export default class GameManager {
  private scene: THREE.Scene;

  private gameState: GameState;

  private inputController!: InputController;
  private player!: Player;
  private terrain!: Terrain;
  private debugUI!: DebugUI;

  constructor(engine: Engine) {
    this.scene = engine.getScene();
    this.gameState = "main-menu";
  }

  initGame() {
    this.inputController = InputController.getInstance();
    this.initLights();
    this.initTerrain();
    this.initPlayer(this.terrain);
    this.initEventListeners(this.player);
    this.initDebugUI();

    this.gameState = "running";
  }

  update(dt: number) {
    const { inputController, player, terrain, debugUI, gameState } = this;

    if (!this.isInitialized()) {
      throw new Error("Game is not initialized!");
    }

    if (gameState === "running") {
      terrain.update(player.getPosition());
      player.update(dt);
      debugUI.update(dt);
      inputController.update(); // this must be come lastly
    }
  }

  private initLights() {
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.2);
    sunLight.position.set(-1, 2, 4);

    const ambientLight = new AmbientLight(0xffffff, 0.8);

    // add lights
    this.scene.add(sunLight, ambientLight);

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
      this.player = new Player(terrain, DEFAULT_PLAYER_MODE);

      this.player.setSpawnOnPosition(0, 25);
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

  private initDebugUI() {
    if (!this.debugUI) {
      this.debugUI = new DebugUI(this.player, this.terrain);
    }
  }

  private isInitialized() {
    return this.gameState != "main-menu";
  }
}
