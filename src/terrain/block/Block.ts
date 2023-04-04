import { Box3, Vector3 } from "three";
import { ChunkModel } from "../chunk";
import {
  BlockFace,
  BlockFaceNormal,
  BlockFacesGeometry,
} from "./BlockGeometry";
import {
  TEXTURE_TILE_HEIGHT,
  TEXTURE_TILE_SIZE,
  TEXTURE_TILE_WIDTH,
} from "./BlockMaterial";
import { BlockRegistry, BlockType } from "./BlockType";

export type BlockTextureFace = "top" | "bottom" | "side";

export type BlockMetadata = {
  name: string;
  isTransparent: boolean;
  isSolid: boolean;
  drop?: BlockType;
  icon: {
    row: number;
    col: number;
  };
  texture: {
    [key in BlockTextureFace]: {
      row: number;
      col: number;
    };
  };
  sounds?: {
    dig?: string[];
    hit?: string[];
  };
};

export type BlockData = {
  type: BlockType;
} & BlockMetadata;

const blockFaceToTextureFace: { [face in BlockFace]: BlockTextureFace } = {
  top: "top",
  bottom: "bottom",
  left: "side",
  right: "side",
  front: "side",
  back: "side",
};

const NeighbourBlockOffsets = [
  [0, 0, 0], // self
  [0, 1, 0], // up
  [0, -1, 0], // down
  // left
  [-1, 0, 0], // left
  [-1, 1, 0], // top left
  [-1, -1, 0], // bottom left
  // right
  [1, 0, 0], // right
  [1, 1, 0], // top right
  [1, -1, 0], // bottom right
  // front
  [0, 0, 1], // front
  [0, 1, 1], // top front
  [0, -1, 1], // bottom front
  [-1, 0, 1], // front left
  [-1, 1, 1], // top front left
  [-1, -1, 1], // bottom front left
  [1, 0, 1], // front right
  [1, 1, 1], // top front right
  [1, -1, 1], // bottom front right
  // back
  [0, 0, -1], // back
  [0, 1, -1], // top back
  [0, -1, -1], // bottom back
  [-1, 0, -1], // back left
  [-1, 1, -1], // top back left
  [-1, -1, -1], // bottom back left
  [1, 0, -1], // back right
  [1, 1, -1], // top back right
  [1, -1, -1], // bottom back right
];

export default class Block {
  static SIZE = 1;

  static isVisibleBlock(block: BlockType | null | undefined) {
    return block != null && block !== BlockType.AIR;
  }

  static getBlockFaces(): BlockFace[] {
    return Object.keys(BlockFacesGeometry) as BlockFace[];
  }

  static getBlockFaceGeometry(face: BlockFace) {
    return BlockFacesGeometry[face];
  }

  static getNeighbourBlockOffsets() {
    return NeighbourBlockOffsets;
  }

  static getBlockMetadata(block: BlockType): BlockMetadata {
    return BlockRegistry[block];
  }

  static getBlockUVCoordinates(
    block: BlockType,
    face: BlockFace,
    [uOff, vOff]: [number, number]
  ) {
    const textureFace = blockFaceToTextureFace[face];
    const { row, col } = BlockRegistry[block].texture[textureFace];

    return {
      u: ((col + uOff) * TEXTURE_TILE_SIZE) / TEXTURE_TILE_WIDTH,
      v: 1 - ((row + 1 - vOff) * TEXTURE_TILE_SIZE) / TEXTURE_TILE_HEIGHT,
    };
  }

  static getBlockFaceFromNormal(normal: THREE.Vector3): BlockFace | null {
    for (const [face, faceNormal] of Object.entries(BlockFaceNormal)) {
      if (new Vector3().fromArray(faceNormal).equals(normal)) {
        return face as BlockFace;
      }
    }
    return null;
  }

  static getBlockBoundingBoxFromPosition(position: THREE.Vector3) {
    return Block.getBlockBoundingBox(
      Block.getBlockOriginFromPosition(position)
    );
  }

  static getBlockBoundingBox(blockOrigin: THREE.Vector3) {
    return new Box3(blockOrigin, blockOrigin.clone().addScalar(Block.SIZE));
  }

  static getBlockOriginFromPosition(position: THREE.Vector3) {
    return new Vector3(
      Math.floor(position.x),
      Math.floor(position.y),
      Math.floor(position.z)
    );
  }

  static toBlockCenterCoord = (val: number) =>
    Math.floor(val / Block.SIZE) * Block.SIZE + Block.SIZE / 2;

  static getBlockNormalFromPosition(
    blockOrigin: THREE.Vector3,
    position: THREE.Vector3
  ) {
    const blockCenter = new Vector3(
      blockOrigin.x + 0.5,
      blockOrigin.y + 0.5,
      blockOrigin.z + 0.5
    );
    const xDiff = Math.abs(position.x - blockCenter.x);
    const yDiff = Math.abs(position.y - blockCenter.y);
    const zDiff = Math.abs(position.z - blockCenter.z);
    const normal = new Vector3();

    if (xDiff > yDiff && xDiff > zDiff) {
      normal.set(position.x > blockCenter.x ? 1 : -1, 0, 0);
    } else if (yDiff > zDiff) {
      normal.set(0, position.y > blockCenter.y ? 1 : -1, 0);
    } else {
      normal.set(0, 0, position.z > blockCenter.z ? 1 : -1);
    }
    return normal;
  }

  /**
   * This is a raycast implementation optmized for voxels
   */
  static raycast(
    rayStart: THREE.Vector3,
    rayEnd: THREE.Vector3,
    blocks: ChunkModel
  ) {
    let dx = rayEnd.x - rayStart.x;
    let dy = rayEnd.y - rayStart.y;
    let dz = rayEnd.z - rayStart.z;

    // calculate the length of the ray
    const lenSq = dx * dx + dy * dy + dz * dz;
    const len = Math.sqrt(lenSq);

    // normalize the 3 dimensions of the ray
    dx /= len;
    dy /= len;
    dz /= len;

    // tracking the current position along the ray and the current voxel being checked
    let t = 0.0;
    let ix = Math.floor(rayStart.x);
    let iy = Math.floor(rayStart.y);
    let iz = Math.floor(rayStart.z);

    // steps for moving in a positive or negative direction in each dimension
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;

    // tracking the time required to the next voxel boundary in each dimension
    const txDelta = Math.abs(1 / dx);
    const tyDelta = Math.abs(1 / dy);
    const tzDelta = Math.abs(1 / dz);

    // calculate the distance to the nearest voxel boundary in each dimension.
    const xDist = stepX > 0 ? ix + 1 - rayStart.x : rayStart.x - ix;
    const yDist = stepY > 0 ? iy + 1 - rayStart.y : rayStart.y - iy;
    const zDist = stepZ > 0 ? iz + 1 - rayStart.z : rayStart.z - iz;

    // location of nearest voxel boundary, in units of t
    let txMax = txDelta < Infinity ? txDelta * xDist : Infinity;
    let tyMax = tyDelta < Infinity ? tyDelta * yDist : Infinity;
    let tzMax = tzDelta < Infinity ? tzDelta * zDist : Infinity;

    // keeps track of which dimension the current step is in
    let steppedIndex = -1;

    // until the current position along the ray is greater than the length of the ray
    while (t <= len) {
      const block = blocks.getBlock({ x: ix, y: iy, z: iz });
      const isVisibleBlock = Block.isVisibleBlock(block?.type);

      // return position, normal and voxel value of the first voxel that we have found
      if (isVisibleBlock) {
        return {
          position: [
            rayStart.x + t * dx,
            rayStart.y + t * dy,
            rayStart.z + t * dz,
          ],
          normal: [
            steppedIndex === 0 ? -stepX : 0,
            steppedIndex === 1 ? -stepY : 0,
            steppedIndex === 2 ? -stepZ : 0,
          ],
          block,
        };
      }

      // advance t to next nearest voxel boundary
      const minMax = Math.min(txMax, tyMax, tzMax);
      if (minMax === txMax) {
        ix += stepX;
        t = txMax;
        txMax += txDelta;
        steppedIndex = 0;
      } else if (minMax === tyMax) {
        iy += stepY;
        t = tyMax;
        tyMax += tyDelta;
        steppedIndex = 1;
      } else {
        iz += stepZ;
        t = tzMax;
        tzMax += tzDelta;
        steppedIndex = 2;
      }
    }

    // no voxel found along the ray
    return null;
  }
}
