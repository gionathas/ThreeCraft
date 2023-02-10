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
import { BlockType } from "./Block";
import Chunk from "./Chunk";

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

    // filling the chunk with blocks from bottom to top
    for (let y = startY; y < chunkHeight; y++) {
      for (let z = startZ; z < endZ; z++) {
        for (let x = startX; x < endX; x++) {
          this.generateBlock(chunk, { x, y, z });
        }
      }
    }
  }

  private generateBlock(chunk: Chunk, { x, y, z }: Coordinate) {
    const surfaceHeight =
      BASE_HEIGHT + this.noise(x / NOISE_SCALE, z / NOISE_SCALE) * HILL_OFFSET;

    let blockType: BlockType;
    if (y < surfaceHeight) {
      blockType = this.generateBlockBelowSurface(y, surfaceHeight);
    } else {
      blockType = this.generateBlockAboveSurface(y, surfaceHeight);
    }

    if (blockType) {
      chunk.setBlock({ x, y, z }, blockType);
    }
  }

  private generateBlockBelowSurface(y: number, surfaceHeight: number) {
    if (y > surfaceHeight - 1) {
      if (y < SEA_LEVEL + 2) {
        return BlockType.SAND;
      } else {
        return BlockType.GRASS;
      }
    } else if (y > TERRAIN_LEVEL) {
      return BlockType.DIRT;
    }

    return BlockType.COBBLESTONE;
  }

  private generateBlockAboveSurface(y: number, surfaceHeight: number) {
    if (y < SEA_LEVEL) {
      return BlockType.WATER;
    }

    return BlockType.AIR;
  }
}
