import alea from "alea";
import { createNoise2D, NoiseFunction2D } from "simplex-noise";
import {
  BASE_HEIGHT,
  HILL_OFFSET,
  NOISE_SCALE,
  SEA_LEVEL,
  TERRAIN_LEVEL,
} from "../config/constants";
import { Coordinate } from "../utils/helpers";
import Chunk from "./Chunk";
import { Voxel } from "./Voxel";

export default class TerrainChunkGenerator {
  private noise: NoiseFunction2D;

  constructor() {
    this.noise = createNoise2D(alea("seed")); //FIXME add seed
  }

  fillTerrain(chunk: Chunk, startX: number, startY: number, startZ: number) {
    const chunkWidth = chunk.width;
    const chunkHeight = chunk.height;

    const endX = startX + chunkWidth;
    const endZ = startZ + chunkWidth;

    // filling the chunk with voxels from bottom to top
    for (let y = startY; y < chunkHeight; y++) {
      for (let z = startZ; z < endZ; z++) {
        for (let x = startX; x < endX; x++) {
          this.generateVoxel(chunk, { x, y, z });
        }
      }
    }
  }

  private generateVoxel(chunk: Chunk, { x, y, z }: Coordinate) {
    const surfaceHeight =
      BASE_HEIGHT + this.noise(x / NOISE_SCALE, z / NOISE_SCALE) * HILL_OFFSET;

    let voxelType: Voxel;
    if (y < surfaceHeight) {
      voxelType = this.generateVoxelBelowSurface(y, surfaceHeight);
    } else {
      voxelType = this.generateVoxelAboveSurface(y, surfaceHeight);
    }

    if (voxelType) {
      chunk.setVoxel({ x, y, z }, voxelType);
    }
  }

  private generateVoxelBelowSurface(y: number, surfaceHeight: number) {
    if (y > surfaceHeight - 1) {
      if (y < SEA_LEVEL + 2) {
        return Voxel.SAND;
      } else {
        return Voxel.GRASS;
      }
    } else if (y > TERRAIN_LEVEL) {
      return Voxel.DIRT;
    }

    return Voxel.COBBLESTONE;
  }

  private generateVoxelAboveSurface(y: number, surfaceHeight: number) {
    if (y < SEA_LEVEL) {
      return Voxel.WATER;
    }

    return Voxel.AIR;
  }
}
