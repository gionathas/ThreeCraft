import * as THREE from "three";
import { EDITING_DISTANCE, EDITING_ENABLED } from "../config/constants";
import Engine from "../core/Engine";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { Block, BlockMarker, BlockType } from "../terrain/block";

export default class EditingControls {
  private scene: THREE.Scene;
  private inputController: InputController;
  private terrain: Terrain;
  private blockMarker: BlockMarker | null;
  private player: Player;

  constructor(player: Player, terrain: Terrain) {
    this.inputController = InputController.getInstance();
    this.scene = Engine.getInstance().getScene();
    this.player = player;
    this.terrain = terrain;
    this.blockMarker = null;
  }

  update() {
    this.updateBlockMarker();
    this.updateBlockPlacement();
  }

  //TODO optimization: to not permit to add a block in the current player position
  private updateBlockPlacement() {
    const leftButton = this.inputController.isLeftButtonJustPressed;
    const rightButton = this.inputController.isRightButtonJustPressed;

    if (leftButton) {
      this.placeBlock(BlockType.AIR); // erasing
    } else if (rightButton) {
      this.placeBlock(BlockType.SAND); //FIXME
    }
  }

  private placeBlock(block: BlockType) {
    const { terrain } = this;

    if (!EDITING_ENABLED) return;

    const targetBlock = this.getTargetBlock();

    if (targetBlock) {
      // the intersection point is on the face. That means
      // the math imprecision could put us on either side of the face.
      // so go half a normal into the voxel if removing (currentVoxel = 0)
      // our out of the voxel if adding (currentVoxel  > 0)
      const [x, y, z] = targetBlock.position.map((v, ndx) => {
        return (
          v + targetBlock.normal[ndx] * (block != BlockType.AIR ? 0.5 : -0.5)
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
    const camera = this.player.getCamera();

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

    return Block.raycast(rayStart, rayEnd, terrain);
  }
}
