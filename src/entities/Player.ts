import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import EditingControls from "../player/EditingControls";
import InventoryManager, { InventoryState } from "../player/InventoryManager";
import PlayerControls from "../player/PlayerControls";
import World from "../terrain/World";
import { getOrientationFromAngle } from "../utils/helpers";
import Terrain from "./Terrain";

export type PlayerControlsMode = "sim" | "fly";

export default class Player {
  private controlsMode: PlayerControlsMode;

  private terrain: Terrain;

  private playerControls: PlayerControls;
  private editingControls: EditingControls;
  private inventoryManager: InventoryManager;

  constructor(terrain: Terrain, inventory: InventoryState) {
    this.terrain = terrain;
    this.controlsMode = EnvVars.PLAYER_DEFAULT_CONTROLS_MODE;

    this.inventoryManager = new InventoryManager(inventory);
    this.playerControls = new PlayerControls(terrain, this.controlsMode);
    this.editingControls = new EditingControls(this, terrain);
  }

  update(dt: number) {
    this.playerControls.update(dt);
    this.editingControls.update();
  }

  dispose() {
    this.playerControls.dispose();
    this.editingControls.dispose();
  }

  setSpawnOnPosition(x: number, z: number) {
    const surfaceHeight = this.terrain.getSurfaceHeight(x, z);
    const playerHeight = this.getHeight();
    this.setSpawn(x, surfaceHeight + playerHeight, z);
  }

  setSpawn(x: number, y: number, z: number) {
    this.playerControls.position.set(x, y, z);
  }

  controlsEnabled() {
    return this.playerControls.isLocked;
  }

  enableControls() {
    this.playerControls.lock();
  }

  disableControls() {
    this.playerControls.unlock();
  }

  onEnableControls(cb: () => void) {
    this.playerControls.onLock(cb);
  }

  onDisableControls(cb: () => void) {
    this.playerControls.onUnlock(cb);
  }

  getMode() {
    return this.controlsMode;
  }

  getWidth() {
    return EnvVars.PLAYER_WIDTH;
  }

  getHeight() {
    return EnvVars.PLAYER_HEIGHT;
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

  getQuaternion() {
    return this.playerControls.getCamera().quaternion.clone();
  }

  setQuaternion(quaternion: THREE.Quaternion) {
    this.playerControls.getCamera().quaternion.copy(quaternion);
  }

  getLookDirection() {
    return this.playerControls
      .getCamera()
      .getWorldDirection(new THREE.Vector3());
  }

  setLookDirection(direction: THREE.Vector3) {
    this.playerControls.getCamera().lookAt(direction);
  }

  getOrientation() {
    const lookDirection = this.getLookDirection();
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
