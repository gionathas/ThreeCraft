import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import GameScene from "../core/GameScene";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { Block, BlockData, BlockMarker, BlockType } from "../terrain/block";
import InventoryManager from "./InventoryManager";

export default class EditingControls {
  static readonly EDITING_DISTANCE = 7;

  private scene: GameScene;
  private inputController: InputController;

  private terrain: Terrain;
  private player: Player;
  private blockMarker: BlockMarker | null;

  private inventory: InventoryManager;

  constructor(player: Player, terrain: Terrain) {
    this.inputController = InputController.getInstance();
    this.scene = GameScene.getInstance();

    this.player = player;
    this.terrain = terrain;
    this.blockMarker = null;

    this.inventory = player.getInventory();
  }

  dispose() {
    if (this.blockMarker) {
      this.scene.remove(this.blockMarker);
      this.blockMarker.geometry.dispose();
      // @ts-ignore
      this.blockMarker.material.dispose();
    }
  }

  update() {
    this.updateBlockMarker();
    this.updateBlockPlacement();
  }

  private updateBlockPlacement() {
    const isM1 = this.inputController.isLeftButtonJustPressed;
    const isM2 = this.inputController.isRightButtonJustPressed;

    // erase block
    if (isM1) {
      const erasedBlock = this.eraseTargetBlock();

      // if a block was erased and it drops something
      // add it to the inventory
      if (erasedBlock && erasedBlock.drop) {
        this.inventory.addItem({
          block: erasedBlock.drop,
          amount: 1,
        });
      }
    }

    // place block
    if (isM2) {
      const selectedItem = this.inventory.getSelectedItem();

      if (selectedItem) {
        const isPlaced = this.placeBlock(selectedItem.block);

        if (isPlaced) {
          this.inventory.decrementSelectedItemAmount();
        }
      }
    }
  }

  /**
   * Erase the block targeted by the player
   *
   * @returns the block that was erased or null if no block was erased
   */
  private eraseTargetBlock(): BlockData | null {
    const { terrain } = this;

    if (!EnvVars.EDITING_ENABLED) return null;

    const targetBlock = this.getTargetBlock();

    if (targetBlock) {
      // the intersection point is on the face. That means
      // the math imprecision could put us on either side of the face.
      // so go half a normal into the voxel if removing or
      // out of the voxel if placing
      const [x, y, z] = targetBlock.position.map((v, ndx) => {
        return v + targetBlock.normal[ndx] * -0.5;
      });

      terrain.setBlock({ x, y, z }, BlockType.AIR);
      return targetBlock.block;
    }

    return null;
  }

  /**
   * Place a block in the targeted position
   *
   * If the block position will collide with the player or
   * no block is reachable, the block will not be placed
   *
   * @returns true if the block was placed, false otherwise
   */
  private placeBlock(block: BlockType): boolean {
    const { terrain } = this;

    if (!EnvVars.EDITING_ENABLED) return false;

    const targetBlock = this.getTargetBlock();

    if (targetBlock) {
      // the intersection point is on the face. That means
      // the math imprecision could put us on either side of the face.
      // so go half a normal into the voxel if removing or
      // out of the voxel if placing
      const [x, y, z] = targetBlock.position.map((v, ndx) => {
        return (
          v + targetBlock.normal[ndx] * (block != BlockType.AIR ? 0.5 : -0.5)
        );
      });

      const blockBoundingBox = Block.getBlockBoundingBoxFromPosition(
        new THREE.Vector3(x, y, z)
      );

      const willBlockCollide = this.player.intersectWith(blockBoundingBox);

      if (!willBlockCollide) {
        terrain.setBlock({ x, y, z }, block);
        return true;
      }
    }

    return false;
  }

  private updateBlockMarker() {
    const targetBlock = this.getTargetBlock();

    // no voxel in sight, hide the marker
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
   * Get the block targeted by the player crosshair
   *
   * @returns the block targeted by the player crosshair or null if no block is targeted
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
    rayLength.multiplyScalar(EditingControls.EDITING_DISTANCE);
    rayEnd.copy(rayStart).add(rayLength);

    return Block.raycast(rayStart, rayEnd, terrain);
  }
}
