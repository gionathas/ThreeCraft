import * as THREE from "three";
import {
  TILE_SIZE,
  TILE_TEXTURES_WIDTH,
  TILE_TEXTURE_HEIGHT,
} from "../core/TextureManager";
import { ChunkModel } from "./Chunk";

export const BLOCK_SIZE = 1;

export enum BlockType {
  AIR = 0,
  COBBLESTONE,
  DIRT,
  GRASS,
  WATER,
  SAND,
  GLASS,
}

enum BlockFaceEnum {
  left,
  right,
  top,
  bottom,
  front,
  back,
}

export type BlockFace = keyof typeof BlockFaceEnum;
type BlockTextureFace = "top" | "bottom" | "side";

type BlockFaceGeometry = {
  normal: [number, number, number];
  vertices: {
    pos: [number, number, number];
    uv: [number, number];
  }[];
};

export type BlockInfo = {
  isTransparent: boolean;
  texture: {
    [key in BlockTextureFace]: {
      row: number;
      col: number;
    };
  };
};

export const Blocks: Record<BlockType, BlockInfo> = {
  [BlockType.AIR]: {
    isTransparent: true,
    texture: {
      top: {
        row: -1,
        col: -1,
      },
      bottom: {
        row: -1,
        col: -1,
      },
      side: {
        row: -1,
        col: -1,
      },
    },
  },
  [BlockType.COBBLESTONE]: {
    isTransparent: false,
    texture: {
      top: {
        row: 0,
        col: 4,
      },
      bottom: {
        row: 0,
        col: 4,
      },
      side: {
        row: 0,
        col: 4,
      },
    },
  },
  [BlockType.GRASS]: {
    isTransparent: false,
    texture: {
      top: {
        row: 0,
        col: 1,
      },
      bottom: {
        row: 0,
        col: 2,
      },
      side: {
        row: 0,
        col: 0,
      },
    },
  },
  [BlockType.DIRT]: {
    isTransparent: false,
    texture: {
      top: {
        row: 0,
        col: 2,
      },
      bottom: {
        row: 0,
        col: 2,
      },
      side: {
        row: 0,
        col: 2,
      },
    },
  },
  [BlockType.SAND]: {
    isTransparent: false,
    texture: {
      top: {
        row: 1,
        col: 6,
      },
      bottom: {
        row: 1,
        col: 6,
      },
      side: {
        row: 1,
        col: 6,
      },
    },
  },
  [BlockType.WATER]: {
    isTransparent: true,
    texture: {
      side: {
        row: 1,
        col: 7,
      },
      top: {
        row: 1,
        col: 7,
      },
      bottom: {
        row: 1,
        col: 7,
      },
    },
  },
  [BlockType.GLASS]: {
    isTransparent: true,
    texture: {
      side: {
        row: 2,
        col: 0,
      },
      top: {
        row: 2,
        col: 0,
      },
      bottom: {
        row: 2,
        col: 0,
      },
    },
  },
};

export const BlockFaceNormal: Record<BlockFace, [number, number, number]> = {
  left: [-1, 0, 0],
  right: [1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};

export const BlockFacesGeometry: Record<BlockFace, BlockFaceGeometry> = {
  left: {
    normal: BlockFaceNormal.left,
    vertices: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  right: {
    normal: BlockFaceNormal.right,
    vertices: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
  },
  top: {
    normal: BlockFaceNormal.top,
    vertices: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  bottom: {
    normal: BlockFaceNormal.bottom,
    vertices: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
  },
  front: {
    normal: BlockFaceNormal.front,
    vertices: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
  back: {
    normal: BlockFaceNormal.back,
    vertices: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
  },
};

const blockFaceToTextureFace: { [face in BlockFace]: BlockTextureFace } = {
  top: "top",
  bottom: "bottom",
  left: "side",
  right: "side",
  front: "side",
  back: "side",
};

export class BlockUtils {
  static isVisibleBlock(block: BlockType | null | undefined) {
    return block != null && block !== BlockType.AIR;
  }

  static getBlockFaces(): BlockFace[] {
    return Object.keys(BlockFacesGeometry) as BlockFace[];
  }

  static getBlockFaceGeometry(face: BlockFace) {
    return BlockFacesGeometry[face];
  }

  static getBlockUVCoordinates(
    block: BlockType,
    face: BlockFace,
    [uOff, vOff]: [number, number]
  ) {
    const textureFace = blockFaceToTextureFace[face];
    const { row, col } = Blocks[block].texture[textureFace];

    return {
      u: ((col + uOff) * TILE_SIZE) / TILE_TEXTURES_WIDTH,
      v: 1 - ((row + 1 - vOff) * TILE_SIZE) / TILE_TEXTURE_HEIGHT,
    };
  }

  static getBlockFaceFromNormal(normal: THREE.Vector3): BlockFace | null {
    for (const [face, faceNormal] of Object.entries(BlockFaceNormal)) {
      if (new THREE.Vector3().fromArray(faceNormal).equals(normal)) {
        return face as BlockFace;
      }
    }
    return null;
  }

  static getBlockNormalFromPosition(
    blockOrigin: THREE.Vector3,
    position: THREE.Vector3
  ) {
    const blockCenter = new THREE.Vector3(
      blockOrigin.x + 0.5,
      blockOrigin.y + 0.5,
      blockOrigin.z + 0.5
    );
    const xDiff = Math.abs(position.x - blockCenter.x);
    const yDiff = Math.abs(position.y - blockCenter.y);
    const zDiff = Math.abs(position.z - blockCenter.z);
    const normal = new THREE.Vector3();

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
  static intersectBlock(
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
      const isVisibleBlock = BlockUtils.isVisibleBlock(block?.type);

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
