import * as THREE from "three";
import { EDITING_DISTANCE, EDITING_ENABLED } from "../config/constants";
import InputController from "../io/InputController";
import PlayerControls from "../player/PlayerControls";
import VoxelMarker from "../player/VoxelMarker";
import { Voxel } from "../terrain/Voxel";
import { intersectVoxel } from "../utils/helpers";
import Terrain from "./Terrain";

export type PlayerMode = "sim" | "dev";

export default class Player {
  private terrain: Terrain;
  private voxelMarker: VoxelMarker | null;

  private scene: THREE.Scene;
  private inputController: InputController;

  private playerControls: PlayerControls;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    scene: THREE.Scene,
    terrain: Terrain,
    mode: PlayerMode
  ) {
    this.scene = scene;
    this.terrain = terrain;
    this.inputController = InputController.getInstance();
    this.voxelMarker = null;
    this.playerControls = new PlayerControls(
      camera,
      domElement,
      scene,
      terrain,
      mode
    );
  }

  update(dt: number) {
    this.playerControls.update(dt);
    this.updateVoxelMarker();
    this.updateVoxelPlacement();
  }

  setSpawn(x: number, y: number, z: number) {
    this.playerControls.position.set(x, y, z);
  }

  //TODO optimization: to not permit to add a block in the current player position
  private updateVoxelPlacement() {
    const leftButton = this.inputController.isLeftButtonJustPressed;
    const rightButton = this.inputController.isRightButtonJustPressed;

    if (leftButton) {
      this.placeVoxel(Voxel.AIR); // erasing
    } else if (rightButton) {
      this.placeVoxel(Voxel.COBBLESTONE); //FIXME
    }
  }

  private placeVoxel(voxel: Voxel) {
    const { terrain } = this;

    if (!EDITING_ENABLED) return;

    const targetVoxel = this.getTargetVoxel();

    if (targetVoxel) {
      // the intersection point is on the face. That means
      // the math imprecision could put us on either side of the face.
      // so go half a normal into the voxel if removing (currentVoxel = 0)
      // our out of the voxel if adding (currentVoxel  > 0)
      const [x, y, z] = targetVoxel.position.map((v, ndx) => {
        return v + targetVoxel.normal[ndx] * (voxel != Voxel.AIR ? 0.5 : -0.5);
      });

      terrain.setBlock({ x, y, z }, voxel);
    }
  }

  private updateVoxelMarker() {
    const targetVoxel = this.getTargetVoxel();

    // any voxel in sight, hide the marker
    if (!targetVoxel && this.voxelMarker) {
      this.voxelMarker.visible = false;
    }

    if (targetVoxel) {
      const voxelNormal = new THREE.Vector3().fromArray(targetVoxel.normal);
      const voxelPosition = new THREE.Vector3().fromArray(targetVoxel.position);

      this.voxelMarker = this.voxelMarker ?? new VoxelMarker();
      this.voxelMarker.adaptToVoxel(voxelPosition, voxelNormal);
      this.voxelMarker.visible = true;

      if (!this.scene.children.includes(this.voxelMarker)) {
        this.scene.add(this.voxelMarker);
      }
    }
  }

  /**
   * Get the first intersected voxel by the screen coordinates
   */
  getTargetVoxel() {
    const [cenX, cenY] = this.inputController.currentPointerCenterCoordinates;
    const { terrain } = this;
    const camera = this.playerControls.getCamera();

    // normalize screen coordinate
    const x = (cenX / window.innerWidth) * 2 - 1;
    const y = -(cenY / window.innerHeight) * 2 + 1;

    const rayStart = new THREE.Vector3();
    const rayEnd = new THREE.Vector3();
    rayStart.setFromMatrixPosition(camera.matrixWorld);
    rayEnd.set(x, y, 1).unproject(camera);

    const rayLength = new THREE.Vector3();
    rayLength.subVectors(rayEnd, rayStart).normalize();
    rayLength.multiplyScalar(EDITING_DISTANCE);
    rayEnd.copy(rayStart).add(rayLength);

    return intersectVoxel(rayStart, rayEnd, terrain);
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
}
