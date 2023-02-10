import * as THREE from "three";
import {
  CHUNK_HEIGHT,
  CHUNK_WIDTH,
  EDITING_DISTANCE,
  EDITING_ENABLED,
} from "../config/constants";
import InputController from "../io/InputController";
import PlayerControls from "../player/PlayerControls";
import BlockMarker from "../player/VoxelMarker";
import { BlockType, BlockUtils } from "../terrain/Block";
import ChunkUtils from "../utils/ChunkUtils";
import Terrain from "./Terrain";

export type PlayerMode = "sim" | "dev";

export default class Player {
  private terrain: Terrain;
  private blockMarker: BlockMarker | null;

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
    this.blockMarker = null;
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
    this.updateBlockMarker();
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
      this.placeBlock(BlockType.AIR); // erasing
    } else if (rightButton) {
      this.placeBlock(BlockType.GLASS); //FIXME
    }
  }

  private placeBlock(block: BlockType) {
    const { terrain } = this;

    if (!EDITING_ENABLED) return;

    const targetVoxel = this.getTargetBlock();

    if (targetVoxel) {
      // the intersection point is on the face. That means
      // the math imprecision could put us on either side of the face.
      // so go half a normal into the voxel if removing (currentVoxel = 0)
      // our out of the voxel if adding (currentVoxel  > 0)
      const [x, y, z] = targetVoxel.position.map((v, ndx) => {
        return (
          v + targetVoxel.normal[ndx] * (block != BlockType.AIR ? 0.5 : -0.5)
        );
      });

      terrain.setBlock({ x, y, z }, block);
    }
  }

  private updateBlockMarker() {
    const targetBlock = this.getTargetBlock();

    // any voxel in sight, hide the marker
    if (!targetBlock && this.blockMarker) {
      this.blockMarker.visible = false;
    }

    if (targetBlock) {
      const blockNormal = new THREE.Vector3().fromArray(targetBlock.normal);
      const blockPosition = new THREE.Vector3().fromArray(targetBlock.position);

      this.blockMarker = this.blockMarker ?? new BlockMarker();
      this.blockMarker.adaptToBlock(blockPosition, blockNormal);
      this.blockMarker.visible = true;

      if (!this.scene.children.includes(this.blockMarker)) {
        this.scene.add(this.blockMarker);
      }
    }
  }

  /**
   * Get the first intersected voxel by the screen coordinates
   */
  getTargetBlock() {
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

    return BlockUtils.intersectBlock(rayStart, rayEnd, terrain);
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
