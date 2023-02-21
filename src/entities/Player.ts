import * as THREE from "three";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../config/constants";
import EditingControls from "../player/EditingControls";
import PlayerControls from "../player/PlayerControls";
import ChunkUtils from "../utils/ChunkUtils";
import { getOrientationFromAngle } from "../utils/helpers";
import Terrain from "./Terrain";

export type PlayerMode = "sim" | "dev";

export default class Player {
  private terrain: Terrain;
  private playerControls: PlayerControls;
  private editingControls: EditingControls;

  constructor(terrain: Terrain, mode: PlayerMode) {
    this.terrain = terrain;
    this.playerControls = new PlayerControls(terrain, mode);
    this.editingControls = new EditingControls(this, terrain);
  }

  update(dt: number) {
    this.playerControls.update(dt);
    this.editingControls.update();
  }

  setSpawnOnPosition(x: number, z: number) {
    const surfaceHeight = this.terrain.getSurfaceHeight(x, z);
    this.setSpawn(x, surfaceHeight + 3, z);
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

  getTargetBlock() {
    return this.editingControls.getTargetBlock();
  }

  getOrientation() {
    const lookDirection = this.playerControls
      .getCamera()
      .getWorldDirection(new THREE.Vector3());
    const angle = Math.atan2(lookDirection.x, lookDirection.z);
    return getOrientationFromAngle(angle);
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
