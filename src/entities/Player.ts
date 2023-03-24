import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import EditingControls from "../player/EditingControls";
import InventoryManager, { InventoryState } from "../player/InventoryManager";
import PlayerCollider from "../player/PlayerCollider";
import PlayerControls from "../player/PlayerControls";
import World from "../terrain/World";
import { getOrientationFromAngle } from "../utils/helpers";
import Terrain from "./Terrain";

export type PlayerControlsMode = "sim" | "fly";

/**
 * The player is represented by a moving camera in the world.
 */
export default class Player {
  static readonly WIDTH = 0.4;
  static readonly HEIGHT = 1.8;

  private controlsMode: PlayerControlsMode;

  private terrain: Terrain;

  private collider: PlayerCollider;
  private controls: PlayerControls;
  private editingControls: EditingControls;
  private inventoryManager: InventoryManager;

  constructor(terrain: Terrain, inventory: InventoryState) {
    this.terrain = terrain;
    this.controlsMode = EnvVars.PLAYER_DEFAULT_CONTROLS_MODE;

    this.inventoryManager = new InventoryManager(inventory);
    this.controls = new PlayerControls(terrain, this.controlsMode);
    this.collider = new PlayerCollider(this);
    this.editingControls = new EditingControls(this, terrain);
  }

  update(dt: number) {
    this.controls.update(dt);
    this.collider.update();
    this.editingControls.update();
  }

  dispose() {
    this.collider.dispose();
    this.controls.dispose();
    this.editingControls.dispose();
  }

  setSpawnPosition(x: number, z: number) {
    const surfaceHeight = this.terrain.getSurfaceHeight(x, z);

    // this will simulate the camera placed on the player's head
    // and the player's feet being 1 block below the surface
    const y = surfaceHeight + Player.HEIGHT + 1;

    this.controls.setCameraPosition(x, y, z);
  }

  /**
   * Corresponds to the player's head position
   */
  getPosition() {
    return this.controls.getCameraPosition().clone();
  }

  controlsEnabled() {
    return this.controls.isLocked;
  }

  enableControls() {
    this.controls.lock();
  }

  disableControls() {
    this.controls.unlock();
  }

  onEnableControls(cb: () => void) {
    this.controls.onLock(cb);
  }

  onDisableControls(cb: () => void) {
    this.controls.onUnlock(cb);
  }

  getMode() {
    return this.controlsMode;
  }

  getVelocity() {
    return this.controls.getVelocity().clone();
  }

  getCamera() {
    return this.controls.getCamera();
  }

  getTargetBlock() {
    return this.editingControls.getTargetBlock();
  }

  intersectWith(entityCollider: THREE.Box3) {
    return this.collider.intersectsWith(entityCollider);
  }

  getQuaternion() {
    return this.controls.getCamera().quaternion.clone();
  }

  setQuaternion(quaternion: THREE.Quaternion) {
    this.controls.getCamera().quaternion.copy(quaternion);
  }

  getLookDirection() {
    return this.controls.getCamera().getWorldDirection(new THREE.Vector3());
  }

  lookAt(direction: THREE.Vector3) {
    this.controls.getCamera().lookAt(direction);
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
    const currentPosition = this.controls.getCameraPosition();
    const chunkId = World.getChunkIdFromPosition(currentPosition);

    return chunkId;
  }
}
