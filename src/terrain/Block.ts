import * as THREE from "three";
import {
  TILE_SIZE,
  TILE_TEXTURES_WIDTH,
  TILE_TEXTURE_HEIGHT,
} from "../core/TextureManager";
import { Coordinate } from "../utils/helpers";

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

export type BlockFace = "left" | "right" | "top" | "bottom" | "front" | "back";
type BlockTextureFace = "top" | "bottom" | "side";

type BlockFaceGeometry = {
  normal: [number, number, number];
  corners: {
    pos: [number, number, number];
    uv: [number, number];
  }[];
};

type BlockInfo = {
  isTransparent: boolean;
  texture: {
    [key in BlockTextureFace]: {
      row: number;
      col: number;
    };
  };
};

export const Block: Record<BlockType, BlockInfo> = {
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
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  right: {
    normal: BlockFaceNormal.right,
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
  },
  top: {
    normal: BlockFaceNormal.top,
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  bottom: {
    normal: BlockFaceNormal.bottom,
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
  },
  front: {
    normal: BlockFaceNormal.front,
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
  back: {
    normal: BlockFaceNormal.back,
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
  },
};

export function isTransparent(type: BlockType) {
  return Block[type].isTransparent;
}

export function getBlockFaceFromNormal(
  normal: THREE.Vector3
): BlockFace | null {
  for (const [face, faceNormal] of Object.entries(BlockFaceNormal)) {
    if (new THREE.Vector3().fromArray(faceNormal).equals(normal)) {
      return face as BlockFace;
    }
  }
  return null;
}

export function getBlockNormalFromPosition(
  blockOrigin: THREE.Vector3,
  position: THREE.Vector3
) {
  const voxelCenter = new THREE.Vector3(
    blockOrigin.x + 0.5,
    blockOrigin.y + 0.5,
    blockOrigin.z + 0.5
  );
  const xDiff = Math.abs(position.x - voxelCenter.x);
  const yDiff = Math.abs(position.y - voxelCenter.y);
  const zDiff = Math.abs(position.z - voxelCenter.z);
  const normal = new THREE.Vector3();

  if (xDiff > yDiff && xDiff > zDiff) {
    normal.set(position.x > voxelCenter.x ? 1 : -1, 0, 0);
  } else if (yDiff > zDiff) {
    normal.set(0, position.y > voxelCenter.y ? 1 : -1, 0);
  } else {
    normal.set(0, 0, position.z > voxelCenter.z ? 1 : -1);
  }
  return normal;
}

const blockFaceToTextureFace: { [face in BlockFace]: BlockTextureFace } = {
  top: "top",
  bottom: "bottom",
  left: "side",
  right: "side",
  front: "side",
  back: "side",
};

export function getBlockTextureCoordinates(
  block: BlockType,
  face: BlockFace,
  [u, v]: [number, number]
) {
  const textureFace = blockFaceToTextureFace[face];
  const { row, col } = Block[block].texture[textureFace];

  return {
    x: ((col + u) * TILE_SIZE) / TILE_TEXTURES_WIDTH,
    y: 1 - ((row + 1 - v) * TILE_SIZE) / TILE_TEXTURE_HEIGHT,
  };
}

export interface ChunkModel {
  getBlock: (blockCoord: Coordinate) => BlockType | null;
}
