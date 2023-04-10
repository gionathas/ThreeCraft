import EditingControls from "../player/EditingControls";
import InventoryManager, { InventoryState } from "../player/InventoryManager";
import PlayerCollider from "../player/PlayerCollider";
import PlayerController from "../player/PlayerController";
import PlayerControls from "../player/PlayerControls";
import PlayerPhysics from "../player/PlayerPhysics";
import World from "../terrain/World";
import { Block } from "../terrain/block";
import { Chunk } from "../terrain/chunk";
import Logger from "../tools/Logger";
import { getOrientationFromAngle } from "../utils/helpers";
import Terrain from "./Terrain";

/**
 * The player is represented by a moving camera in the world.
 */
export default class Player {
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
    this.physics = new PlayerPhysics(this.controller, this.controls, terrain);
    this.collider = new PlayerCollider(this.controls);
    this.inventory = new InventoryManager(inventory);
    this.editingControls = new EditingControls(
      this.controller,
      this.collider,
      this.inventory,
      terrain
    );
  }

  init(lookRotation: THREE.Quaternion, spawn?: THREE.Vector3) {
    Logger.info("Initializing player...", Logger.INIT_KEY);
    this.setRotation(lookRotation);

    if (spawn) {
      Logger.debug("Loading spawn position...", Logger.PLAYER_KEY);
      this.setSpawnPosition(spawn.x, spawn.y, spawn.z);
    } else {
      Logger.debug(
        "No spawn position found, using world origin...",
        Logger.PLAYER_KEY
      );
      const worldOrigin = World.ORIGIN;
      this.setFirstSpawnPosition(worldOrigin.x, worldOrigin.y, worldOrigin.z);
    }
  }

  update(dt: number) {
    this.physics.update(dt);
    this.collider.update();
    this.editingControls.update();
    //TODO DebugInfo.updatePlayerInfo(this);
  }

  dispose() {
    Logger.info("Disposing player...", Logger.DISPOSE_KEY);
    this.collider.dispose();
    this.controls.dispose();
    this.editingControls.dispose();
    Logger.info("Player disposed!", Logger.DISPOSE_KEY);
  }

  controlsLocked() {
    return this.controls.isLocked;
  }

  lockControls() {
    this.controls.lock();
  }

  unlockControls() {
    this.controls.unlock();
  }

  onEnableControls(cb: () => void) {
    this.controls.onLock(cb);
  }

  onDisableControls(cb: () => void) {
    this.controls.onUnlock(cb);
  }

  setFirstSpawnPosition(x: number, y: number, z: number) {
    const surfaceHeight = this.terrain.getSurfaceHeight(x, z);

    // move rightward until we find a free spot
    while (this.terrain.hasTreeAt(x, z)) {
      x += 1;
    }

    // simulating falling from some blocks offset and the camera placed
    // at the player's eye level
    y = PlayerControls.getEyeHeightFromGround(surfaceHeight) + 3;

    // spawn the player at the center of the block
    const cenX = Block.toBlockCenterCoord(x);
    const cenZ = Block.toBlockCenterCoord(z);

    this.setSpawnPosition(cenX, y, cenZ);
  }

  setSpawnPosition(x: number, y: number, z: number) {
    this.controls.position.set(x, y, z);
  }

  /**
   * Corresponds to the player's head position
   */
  getPosition() {
    return this.controls.position.clone();
  }

  getGroundState() {
    return this.physics.getGroundState();
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

  setRotation(quaternion: THREE.Quaternion) {
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
    const chunkId = Chunk.getChunkIdFromPosition(currentPosition);

    return chunkId;
  }
}
