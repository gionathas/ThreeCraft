import * as THREE from "three";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../config/constants";
import EditingControls from "../player/EditingControls";
import PlayerControls from "../player/PlayerControls";
import ChunkUtils from "../utils/ChunkUtils";
import Terrain from "./Terrain";

export type PlayerMode = "sim" | "dev";

export default class Player {
  private playerControls: PlayerControls;
  private editingControls: EditingControls;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    scene: THREE.Scene,
    terrain: Terrain,
    mode: PlayerMode
  ) {
    this.playerControls = new PlayerControls(
      camera,
      domElement,
      scene,
      terrain,
      mode
    );

    this.editingControls = new EditingControls(scene, this, terrain);
  }

  update(dt: number) {
    this.playerControls.update(dt);
    this.editingControls.update();
  }

  setSpawn(x: number, y: number, z: number) {
    this.playerControls.position.set(x, y, z);
  }

  enableControls() {
    return this.playerControls.lock();
  }

  setOnControlsEnabled(func: () => void) {
    return this.playerControls.addEventListener("lock", func);
  }

  setOnControlsDisabled(func: () => void) {
    return this.playerControls.addEventListener("unlock", func);
  }

  getWidth() {
    return this.playerControls.width;
  }

  getHeight() {
    return this.playerControls.height;
  }

  getPosition() {
    return this.playerControls.position.clone();
  }

  getVelocity() {
    return this.playerControls.getVelocity().clone();
  }

  getCamera() {
    return this.playerControls.getCamera();
  }

  get _currentChunkCoordinates() {
    const currentPosition = this.playerControls.position;
    const chunkId = ChunkUtils.computeChunkIdFromPosition(
      currentPosition,
      CHUNK_WIDTH,
      CHUNK_HEIGHT
    );

    return chunkId;
  }
}
