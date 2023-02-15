import { SEA_LEVEL } from "../config/constants";
import TerrainMap from "../noise/TerrainMap";
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
  private terrainMap: TerrainMap;

  constructor(seed: string) {
    this.terrainMap = new TerrainMap(seed);
  }

  fillTerrain(chunk: Chunk, startX: number, startY: number, startZ: number) {
    const chunkWidth = chunk.width;
    const chunkHeight = chunk.height;

    const endX = startX + chunkWidth;
    const endZ = startZ + chunkWidth;

    // filling the chunk with blocks from bottom to top
    for (let y = startY; y < startY + chunkHeight; y++) {
      for (let z = startZ; z < endZ; z++) {
        for (let x = startX; x < endX; x++) {
          const surfaceHeight = this.terrainMap.getHeight(x, z);
          this.generateBlock(chunk, { x, y, z }, surfaceHeight);
        }
      }
    }
  }

  private generateBlock(
    chunk: Chunk,
    { x, y, z }: Coordinate,
    surfaceHeight: number
  ) {
    let blockType: BlockType;
    if (y < surfaceHeight) {
      blockType = this.generateBlockBelowSurface(x, y, z, surfaceHeight);
    } else {
      blockType = this.generateBlockAboveSurface(y, surfaceHeight);
    }

    // add the block inside the chunk
    chunk.setBlock({ x, y, z }, blockType);
  }

  // private generateBlockBelowSurface(y: number, surfaceHeight: number) {
  //   return BlockType.COBBLESTONE;
  // }

  // private generateBlockBelowSurface(y: number, surfaceHeight: number) {
  //   if (y > surfaceHeight - 1) {
  //     if (y < SEA_LEVEL + 2) {
  //       return BlockType.SAND;
  //     } else {
  //       return BlockType.GRASS;
  //     }
  //   } else if (Math.abs(y - surfaceHeight) > 10) {
  //     return BlockType.DIRT;
  //   }

  //   return BlockType.COBBLESTONE;
  // }

  private generateBlockBelowSurface(
    x: number,
    y: number,
    z: number,
    surfaceHeight: number
  ) {
    const pv = this.terrainMap.getPV(x, z);

    if (pv <= -0.6 || pv >= 0.5) {
      return BlockType.COBBLESTONE;
    }

    if (Math.abs(y - surfaceHeight) < 1) {
      if (y < SEA_LEVEL + 2) {
        return BlockType.SAND;
      } else {
        return BlockType.GRASS;
      }
    }

    return BlockType.GRASS;
  }

  private generateBlockAboveSurface(y: number, surfaceHeight: number) {
    if (y < SEA_LEVEL) {
      return BlockType.WATER;
    }

    return BlockType.AIR;
  }
}
