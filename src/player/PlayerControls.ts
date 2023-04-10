import { Vector3 } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import Game from "../core/Game";
import PlayerConstants from "./PlayerConstants";
import PlayerController from "./PlayerController";

export default class PlayerControls extends PointerLockControls {
  private static readonly CAMERA_EYE_OFFSET_FROM_HEAD = 0.1;

  private playerController: PlayerController;

  private lockCbs: (() => void)[];
  private unlockCbs: (() => void)[];
  private onControlLockHandlerRef: () => void;
  private onControlUnlockHandlerRef: () => void;

  constructor(playerController: PlayerController) {
    super(
      Game.instance().getScene().getCamera(),
      Game.instance().getRenderer().getCanvas()
    );

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
    return this.camera.getWorldDirection(new Vector3());
  }

  lookAt(direction: THREE.Vector3) {
    this.camera.lookAt(direction);
  }

  getFeetHeight() {
    const headY = this.getHeadHeight();
    const height = PlayerConstants.HEIGHT;

    return headY - height;
  }

  getCenterOfMassHeight() {
    const headY = this.getHeadHeight();
    const height = PlayerConstants.HEIGHT;

    return headY - height / 2;
  }

  getHeadHeight() {
    const eyeY = this.getEyeHeight();
    return eyeY + PlayerControls.CAMERA_EYE_OFFSET_FROM_HEAD;
  }

  getEyeHeight() {
    return this.position.y;
  }

  static getEyeHeightFromGround(groundY: number) {
    const height = PlayerConstants.HEIGHT;
    const eyeOffset = PlayerControls.CAMERA_EYE_OFFSET_FROM_HEAD;

    return groundY + height - eyeOffset;
  }

  static getEyeHeightFromHead(headY: number) {
    const eyeOffset = PlayerControls.CAMERA_EYE_OFFSET_FROM_HEAD;

    return headY - eyeOffset;
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
