import { Vector3 } from "three";
import DigSoundEffect from "../audio/DigSoundEffect";
import EnvVars from "../config/EnvVars";
import Game from "../core/Game";
import GameCamera from "../core/GameCamera";
import GameScene from "../core/GameScene";
import Terrain from "../entities/Terrain";
import { Block, BlockData, BlockType } from "../terrain/block";
import BlockMarker from "../terrain/block/BlockMarker";
import InventoryManager from "./InventoryManager";
import PlayerCollider from "./PlayerCollider";
import PlayerController from "./PlayerController";

export default class EditingControls {
  static readonly EDITING_DISTANCE = 7;

  private scene: GameScene;
  private camera: GameCamera;
  private playerController: PlayerController;
  private terrain: Terrain;

  private blockMarker: BlockMarker | null;

  private playerCollider: PlayerCollider;
  private inventory: InventoryManager;

  // sounds
  private digSoundEffect: DigSoundEffect;

  constructor(
    playerController: PlayerController,
    playerCollider: PlayerCollider,
    playerInventory: InventoryManager,
    terrain: Terrain
  ) {
    this.scene = Game.instance().getScene();
    this.camera = this.scene.getCamera();
    this.playerController = playerController;
    this.digSoundEffect = new DigSoundEffect();

    this.terrain = terrain;
    this.playerCollider = playerCollider;
    this.inventory = playerInventory;
    this.blockMarker = null;
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
    const isErasing = this.playerController.isErasingBlock();
    const isPlacing = this.playerController.isPlacingBlock();

    // erase block
    if (isErasing) {
      const erasedBlock = this.eraseTargetBlock();

      if (erasedBlock) {
        // sound effect
        this.digSoundEffect.playBlockDestroySound(erasedBlock);

        // if it drops something, add it to the inventory
        if (erasedBlock.drop) {
          this.inventory.addItem({
            block: erasedBlock.drop,
            amount: 1,
          });
        }
      }
    }

    // place block
    if (isPlacing) {
      const selectedItem = this.inventory.getSelectedItem();

      if (selectedItem) {
        const block = selectedItem.block;
        const isPlaced = this.placeBlock(block);

        if (isPlaced) {
          const blockData = Block.getBlockMetadata(block);

          // sound effect
          this.digSoundEffect.playBlockPlacementSound(blockData);

          // decrement item amount
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
        new Vector3(x, y, z)
      );

      const willBlockCollide =
        this.playerCollider.intersectsWith(blockBoundingBox);

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
      const blockNormal = new Vector3().fromArray(targetBlock.normal);
      const blockPosition = new Vector3().fromArray(targetBlock.position);

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
    const [cenX, cenY] = this.playerController.getCrosshairPosition();
    const { terrain } = this;
    const playerCamera = this.camera;

    // normalize screen coordinate
    const x = (cenX / window.innerWidth) * 2 - 1;
    const y = -(cenY / window.innerHeight) * 2 + 1;

    const rayStart = new Vector3();
    const rayEnd = new Vector3();
    rayStart.setFromMatrixPosition(playerCamera.matrixWorld);
    rayEnd.set(x, y, 1).unproject(playerCamera);

    const rayLength = new Vector3();
    rayLength.subVectors(rayEnd, rayStart).normalize();
    rayLength.multiplyScalar(EditingControls.EDITING_DISTANCE);
    rayEnd.copy(rayStart).add(rayLength);

    return Block.raycast(rayStart, rayEnd, terrain);
  }
}
