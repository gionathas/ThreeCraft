import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import EditingControls from "../player/EditingControls";
import InventoryManager, { InventoryState } from "../player/InventoryManager";
import PlayerCollider from "../player/PlayerCollider";
import PlayerController from "../player/PlayerController";
import PlayerControls from "../player/PlayerControls";
import PlayerPhysics from "../player/PlayerPhysics";
import World from "../terrain/World";
import { getOrientationFromAngle } from "../utils/helpers";
import Terrain from "./Terrain";

export type PlayerControlsMode = "sim" | "fly";

/**
 * The player is represented by a moving camera in the world.
 *
 * //TODO add DebugInfo dependency
 */
export default class Player {
  static readonly WIDTH = 0.4;
  static readonly HEIGHT = 1.8;

  private terrain: Terrain;

  private controller: PlayerController;
  private controls: PlayerControls;
  private collider: PlayerCollider;
  private physics: PlayerPhysics;

  private inventory: InventoryManager;
  private editingControls: EditingControls;

  constructor(terrain: Terrain, inventory: InventoryState) {
    this.terrain = terrain;

    this.controller = new PlayerController();
    this.controls = new PlayerControls(this.controller);
    this.physics = new PlayerPhysics(
      this.controller,
      this.controls,
      terrain,
      EnvVars.PLAYER_DEFAULT_CONTROLS_MODE
    );
    this.collider = new PlayerCollider();
    this.inventory = new InventoryManager(inventory);
    this.editingControls = new EditingControls(
      this.controller,
      this.collider,
      this.inventory,
      terrain
    );
  }

  update(dt: number) {
    this.physics.update(dt);
    this.collider.update(this.getPosition());
    this.editingControls.update();
    //TODO DebugInfo.updatePlayerInfo(this);
  }

  dispose() {
    this.collider.dispose();
    this.controls.dispose();
    this.editingControls.dispose();
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

  setSpawnPosition(x: number, z: number) {
    const surfaceHeight = this.terrain.getSurfaceHeight(x, z);

    // this will simulate the camera placed on the player's head
    // and the player's feet being 1 block below the surface
    const y = surfaceHeight + Player.HEIGHT + 1;

    this.controls.position.set(x, y, z);
  }

  /**
   * Corresponds to the player's head position
   */
  getPosition() {
    return this.controls.position.clone();
  }

  getMode() {
    return this.physics.getMode();
  }

  getVelocity() {
    return this.physics.getVelocity().clone();
  }

  getCamera() {
    return this.controls.camera;
  }

  getTargetBlock() {
    return this.editingControls.getTargetBlock();
  }

  intersectWith(entityCollider: THREE.Box3) {
    return this.collider.intersectsWith(entityCollider);
  }

  getQuaternion() {
    return this.controls.quaternion.clone();
  }

  setQuaternion(quaternion: THREE.Quaternion) {
    this.controls.quaternion.copy(quaternion);
  }

  getLookDirection() {
    return this.controls.getLookDirection();
  }

  lookAt(direction: THREE.Vector3) {
    this.controls.lookAt(direction);
  }

  getOrientation() {
    const lookDirection = this.getLookDirection();
    const angle = Math.atan2(lookDirection.x, lookDirection.z);
    return getOrientationFromAngle(angle);
  }

  getInventory() {
    return this.inventory;
  }

  get _currentChunkId() {
    const currentPosition = this.getPosition();
    const chunkId = World.getChunkIdFromPosition(currentPosition);

    return chunkId;
  }
}
