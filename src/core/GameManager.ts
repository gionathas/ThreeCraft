import * as THREE from "three";
import { AmbientLight } from "three";
import { DEFAULT_PLAYER_MODE } from "../config/constants";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import Engine from "./Engine";

type GameState = "running" | "paused" | "main-menu";

export default class GameManager {
  private engine: Engine;
  private scene: THREE.Scene;

  private gameState: GameState;

  private inputController!: InputController;
  private player!: Player;
  private terrain!: Terrain;

  constructor(engine: Engine) {
    this.engine = engine;
    this.scene = engine.getScene();
    this.gameState = "main-menu";
  }

  initGame() {
    this.inputController = InputController.getInstance();
    this.initLights();
    this.initTerrain();
    this.initPlayer(this.terrain);
    this.initEventListeners(this.player);

    this.gameState = "running";
  }

  update(dt: number) {
    const { inputController, player, terrain, gameState } = this;

    if (!this.isInitialized()) {
      throw new Error("Game is not initialized!");
    }

    if (gameState === "running") {
      terrain.update(player.getPosition());
      player.update(dt);
      inputController.update();
      this.updateUI();
    }
  }

  //TODO extract into a proper class
  private updateUI() {
    const infoUI = document.getElementById("infoUI");

    const [px, py, pz] = this.player.getPosition().toArray();
    const [vx, vy, vz] = this.player.getVelocity().toArray();
    const orientation = this.player.getOrientation();

    const targetBlock = this.player.getTargetBlock();
    const currentChunkId = this.player._currentChunkCoordinates;
    const totalChunks = this.terrain.totalChunks;
    const totalMesh = this.terrain._totalMesh;

    const continentalness = this.terrain._getContinentalness(px, pz);
    const erosion = this.terrain._getErosion(px, pz);
    const pv = this.terrain._getPV(px, pz);

    infoUI!.innerHTML = `<p>Orientation: ${orientation}</p>`;
    infoUI!.innerHTML += `<p>x: ${px.toFixed(2)} y: ${py.toFixed(
      2
    )} z: ${pz.toFixed(2)}</p>`;
    infoUI!.innerHTML += `<p>vx: ${vx.toFixed(2)} vy: ${vy.toFixed(
      2
    )} vz: ${vz.toFixed(2)}</p>`;

    // infoUI!.innerHTML += `<p>Target Block: (${targetBlock?.position.map(
    //   (block) => Math.floor(block)
    // )})</p>`;
    infoUI!.innerHTML += `<p>Current Chunk: (${currentChunkId})</p>`;
    infoUI!.innerHTML += `<p>Chunks: ${totalChunks}</p>`;
    infoUI!.innerHTML += `<p>Total Mesh: ${totalMesh}</p>`;
    infoUI!.innerHTML += `<p>Erosion: ${erosion.toFixed(3)}</p>`;
    infoUI!.innerHTML += `<p>PV: ${pv.toFixed(3)}</p>`;
    infoUI!.innerHTML += `<p>Continentalness: ${continentalness.toFixed(
      3
    )}</p>`;
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
    const spawn = new THREE.Vector3(0, 0, 0);

    this.terrain = new Terrain(spawn);
    this.terrain.update(spawn, true);
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

  //TODO wait terrain loading
  private initPlayer(terrain: Terrain) {
    if (!this.player) {
      this.player = new Player(terrain, DEFAULT_PLAYER_MODE);

      this.player.setSpawnOnPosition(0, 25);
    }
  }

  private isInitialized() {
    return this.gameState != "main-menu";
  }
}
