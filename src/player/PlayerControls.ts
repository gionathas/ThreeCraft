import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import Engine from "../core/Engine";
import GameCamera from "../core/GameCamera";
import Player from "../entities/Player";
import PlayerController from "./PlayerController";

export default class PlayerControls extends PointerLockControls {
  private static readonly CAMERA_EYE_OFFSET_FROM_HEAD = 0.1;

  private playerController: PlayerController;

  private lockCbs: (() => void)[];
  private unlockCbs: (() => void)[];
  private onControlLockHandlerRef: () => void;
  private onControlUnlockHandlerRef: () => void;

  constructor(playerController: PlayerController) {
    super(GameCamera.getInstance(), Engine.getInstance().getCanvas());

    this.playerController = playerController;

    // lock/unlock event handlers
    this.lockCbs = [];
    this.unlockCbs = [];
    this.onControlLockHandlerRef = this.onControlLockHandler.bind(this);
    this.onControlUnlockHandlerRef = this.onControlUnlockHandler.bind(this);
    this.onLock(this.onControlLockHandlerRef);
    this.onUnlock(this.onControlUnlockHandlerRef);
  }

  moveUp(distance: number) {
    this.position.y += distance;
  }

  moveX(distance: number) {
    this.position.x += distance;
  }

  moveZ(distance: number) {
    this.position.z += distance;
  }

  private onControlLockHandler() {
    this.playerController.enableControls();
  }

  private onControlUnlockHandler() {
    this.playerController.disableControls();
  }

  onLock(cb: () => void) {
    this.addEventListener("lock", cb);
    this.lockCbs.push(cb);
  }

  onUnlock(cb: () => void) {
    this.addEventListener("unlock", cb);
    this.unlockCbs.push(cb);
  }

  dispose() {
    this.dispose();
    this.lockCbs.forEach((cb) => this.removeEventListener("lock", cb));
    this.unlockCbs.forEach((cb) => this.removeEventListener("unlock", cb));
  }

  getLookDirection() {
    return this.camera.getWorldDirection(new THREE.Vector3());
  }

  lookAt(direction: THREE.Vector3) {
    this.camera.lookAt(direction);
  }

  getFeetHeight() {
    const headY = this.getHeadHeight();
    return headY - Player.HEIGHT;
  }

  getCenterOfMassHeight() {
    const headY = this.getHeadHeight();
    return headY - Player.HEIGHT / 2;
  }

  getHeadHeight() {
    const eyeY = this.getEyeHeight();
    return eyeY + PlayerControls.CAMERA_EYE_OFFSET_FROM_HEAD;
  }

  getEyeHeight() {
    return this.position.y;
  }

  static getEyeHeightFromGround(groundY: number) {
    return groundY + Player.HEIGHT - PlayerControls.CAMERA_EYE_OFFSET_FROM_HEAD;
  }

  static getEyeHeightFromHead(headY: number) {
    return headY - PlayerControls.CAMERA_EYE_OFFSET_FROM_HEAD;
  }

  /**
   * Corresponds to the player's camera position
   */
  get position() {
    return this.camera.position;
  }

  get quaternion() {
    return this.camera.quaternion;
  }

  get camera() {
    return this.getObject();
  }
}
