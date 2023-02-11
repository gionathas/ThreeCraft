import alea from "alea";
import { createNoise2D, NoiseFunction2D } from "simplex-noise";
import {
  HILL_OFFSET,
  NOISE_SCALE,
  SEA_LEVEL,
  TERRAIN_LEVEL,
} from "../config/constants";
import { Coordinate } from "../utils/helpers";
import { BlockType } from "./Block";
import Chunk from "./Chunk";

/**
 * //TODO optimization: instead of creating an heightmap for each chunk,
 * we can create a bigger heightmap shared by all chunks.
 * In this way we calculate the heightMap for the entire terrain only one time.
 * The heightMap will be shared by all workers, such that they will not need to compute
 * the heightMap at first pass.
 *
 * Possible downside is that the heightMap should be calculated by the main thread
 *  (nested loop that iterate over the x and z plane), whereas with the current implementation
 *  workers are calculating (and caching) the heightMap by themself but wasting computation
 */
export default class TerrainChunkGenerator {
  private noise: NoiseFunction2D;
  private heightMap: Record<string, number>;

  // TODO take in input the seed value (in order to be shared by the workers)
  constructor() {
    this.noise = createNoise2D(alea("seed")); //FIXME add seed
    this.heightMap = {};
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
          const surfaceHeight = this.generateSurfaceHeight(x, z);
          this.generateBlock(chunk, { x, y, z }, surfaceHeight);
        }
      }
    }
  }

  private generateSurfaceHeight(x: number, z: number) {
    const key = `${x},${z}`;

    if (this.heightMap[key] != null) {
      return this.heightMap[key];
    }

    const value =
      TERRAIN_LEVEL +
      this.noise(x / NOISE_SCALE, z / NOISE_SCALE) * HILL_OFFSET;
    this.heightMap[key] = value;
    return value;
  }

  private generateBlock(
    chunk: Chunk,
    { x, y, z }: Coordinate,
    surfaceHeight: number
  ) {
    let blockType: BlockType;
    if (y < surfaceHeight) {
      blockType = this.generateBlockBelowSurface(y, surfaceHeight);
    } else {
      blockType = this.generateBlockAboveSurface(y, surfaceHeight);
    }

    // add the block inside the chunk
    chunk.setBlock({ x, y, z }, blockType);
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
