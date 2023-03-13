import * as THREE from "three";
import EditingControls from "../player/EditingControls";
import InventoryManager from "../player/InventoryManager";
import PlayerControls from "../player/PlayerControls";
import World from "../terrain/World";
import { getOrientationFromAngle } from "../utils/helpers";
import Terrain from "./Terrain";

export type PlayerMode = "sim" | "dev";

export default class Player {
  private terrain: Terrain;
  private playerControls: PlayerControls;
  private editingControls: EditingControls;
  private inventoryManager: InventoryManager;

  constructor(terrain: Terrain, mode: PlayerMode) {
    this.terrain = terrain;
    this.playerControls = new PlayerControls(terrain, mode);
    this.editingControls = new EditingControls(this, terrain);
    this.inventoryManager = new InventoryManager(this);
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

  disableControls() {
    this.playerControls.unlock();
  }

  setOnLockControls(func: () => void) {
    return this.playerControls.addEventListener("lock", func);
  }

  setOnUnlockControls(func: () => void) {
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

  getInventoryManager() {
    return this.inventoryManager;
  }

  get _currentChunkId() {
    const currentPosition = this.playerControls.position;
    const chunkId = World.getChunkIdFromPosition(currentPosition);

    return chunkId;
  }
}
