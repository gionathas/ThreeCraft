import * as THREE from "three";
import {
  TILE_SIZE,
  TILE_TEXTURES_WIDTH,
  TILE_TEXTURE_HEIGHT,
} from "../core/TextureManager";
import { Coordinate } from "../utils/helpers";

export const VOXEL_SIZE = 1;

export enum Voxel {
  AIR = 0,
  COBBLESTONE = 4,
  DIRT = 15,
  GRASS = 14,
  WATER = 13,
  SAND = 3,
}

export type VoxelFace = "Left" | "Right" | "Top" | "Bottom" | "Front" | "Back";

export const VoxelFacesNormal: Record<VoxelFace, [number, number, number]> = {
  Left: [-1, 0, 0],
  Right: [1, 0, 0],
  Top: [0, 1, 0],
  Bottom: [0, -1, 0],
  Front: [0, 0, 1],
  Back: [0, 0, -1],
};

type VoxelGeometry = {
  normal: [number, number, number];
  corners: {
    pos: [number, number, number];
    uv: [number, number];
  }[];
};

export function detectFace(normal: THREE.Vector3): VoxelFace | null {
  for (const [face, faceNormal] of Object.entries(VoxelFacesNormal)) {
    if (new THREE.Vector3().fromArray(faceNormal).equals(normal)) {
      return face as VoxelFace;
    }
  }
  return null;
}

export function getBlockTextureCoordinates(
  voxel: Voxel,
  face: VoxelFace,
  [u, v]: [number, number]
) {
  const textureFace = getTextureFace(face);
  const { row, col } = VoxelTextures[voxel][textureFace];

  return {
    x: ((col + u) * TILE_SIZE) / TILE_TEXTURES_WIDTH,
    y: 1 - ((row + 1 - v) * TILE_SIZE) / TILE_TEXTURE_HEIGHT,
  };
}

function getTextureFace(face: VoxelFace): TextureFace {
  switch (face) {
    case "Top":
      return "top";
    case "Bottom":
      return "bottom";
    default:
      return "side";
  }
}

export function getVoxelNormal(
  voxelOrigin: THREE.Vector3,
  position: THREE.Vector3
) {
  const voxelCenter = new THREE.Vector3(
    voxelOrigin.x + 0.5,
    voxelOrigin.y + 0.5,
    voxelOrigin.z + 0.5
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

export const VoxelFacesGeometry: Record<VoxelFace, VoxelGeometry> = {
  Left: {
    normal: VoxelFacesNormal.Left,
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  Right: {
    normal: VoxelFacesNormal.Right,
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
  },
  Top: {
    normal: VoxelFacesNormal.Top,
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  Bottom: {
    normal: VoxelFacesNormal.Bottom,
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
  },
  Front: {
    normal: VoxelFacesNormal.Front,
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
  Back: {
    normal: VoxelFacesNormal.Back,
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
  },
};

type TextureFace = "top" | "bottom" | "side";
type TextureCoordinate = { [key in TextureFace]: { row: number; col: number } };
const VoxelTextures: Record<number, TextureCoordinate> = {
  [Voxel.COBBLESTONE]: {
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
  [Voxel.GRASS]: {
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
  [Voxel.DIRT]: {
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
  [Voxel.SAND]: {
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
  [Voxel.WATER]: {
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
};

export interface VoxelModel {
  getBlock: (voxelCoord: Coordinate) => Voxel | null;
}
