import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import EditingControls from "../player/EditingControls";
import InventoryManager from "../player/InventoryManager";
import PlayerControls from "../player/PlayerControls";
import World from "../terrain/World";
import { getOrientationFromAngle } from "../utils/helpers";
import Terrain from "./Terrain";

export type PlayerMode = "sim" | "fly";

export default class Player {
  private mode: PlayerMode;

  private terrain: Terrain;

  private playerControls: PlayerControls;
  private editingControls: EditingControls;
  private inventoryManager: InventoryManager;

  constructor(terrain: Terrain, mode: PlayerMode) {
    this.terrain = terrain;
    this.mode = mode;
    this.inventoryManager = new InventoryManager();

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

  lockControls() {
    this.playerControls.lock();
  }

  unlockControls() {
    this.playerControls.unlock();
  }

  isControlsLocked() {
    return this.playerControls.isLocked;
  }

  setOnLockControls(func: () => void) {
    return this.playerControls.addEventListener("lock", func);
  }

  setOnUnlockControls(func: () => void) {
    return this.playerControls.addEventListener("unlock", func);
  }

  getMode() {
    return this.mode;
  }

  getWidth() {
    return EnvVars.VITE_PLAYER_WIDTH;
  }

  getHeight() {
    return EnvVars.VITE_PLAYER_HEIGHT;
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

  intersectBlock(blockBB: THREE.Box3) {
    return this.playerControls.intersectsBlock(blockBB);
  }

  getOrientation() {
    const lookDirection = this.playerControls
      .getCamera()
      .getWorldDirection(new THREE.Vector3());
    const angle = Math.atan2(lookDirection.x, lookDirection.z);
    return getOrientationFromAngle(angle);
  }

  getInventory() {
    return this.inventoryManager;
  }

  get _currentChunkId() {
    const currentPosition = this.playerControls.position;
    const chunkId = World.getChunkIdFromPosition(currentPosition);

    return chunkId;
  }
}
