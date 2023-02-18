import { SEA_LEVEL } from "../config/constants";
import TerrainMap from "../noise/TerrainMap";
import { Coordinate } from "../utils/helpers";
import { BlockType } from "./Block";
import Chunk from "./Chunk";

/**
 * //TODO optimization: instead of creating an heightmap for each chunk worker,
 * we can share an unique heightmap between all workers.
 *
 * In this way we calculate the heightMap for the entire terrain only one time.
 * The heightMap will be shared by all workers, such that they will not need to compute
 * the heightMap at first pass.
 *
 * Possible downside is that the heightMap should be calculated by the main thread
 *  (nested loop that iterate over the x and z plane), whereas with the current implementation
 *  workers are calculating (and caching) the heightMap by themself but wasting computation
 */
export default class TerrainChunkDecorator {
  private terrainMap: TerrainMap;

  constructor(terrainMap: TerrainMap) {
    this.terrainMap = terrainMap;
  }

  fillChunk(chunk: Chunk, { x: startX, y: startY, z: startZ }: Coordinate) {
    const chunkWidth = chunk.width;
    const chunkHeight = chunk.height;

    const endX = startX + chunkWidth;
    const endZ = startZ + chunkWidth;
    const endY = startY + chunkHeight;

    // filling the chunk with blocks from bottom to top
    for (let y = startY; y < endY; y++) {
      for (let z = startZ; z < endZ; z++) {
        for (let x = startX; x < endX; x++) {
          const surfaceHeight = this.terrainMap.getSurfaceHeight(x, z);
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

  private generateBlockBelowSurface(
    x: number,
    y: number,
    z: number,
    surfaceHeight: number
  ) {
    const distFromSurface = Math.abs(y - surfaceHeight);
    const pv = this.terrainMap.getPV(x, z);
    const erosion = this.terrainMap.getErosion(x, z);

    const isMountain = pv >= 0.5;

    // first layer (0 - 1)
    if (distFromSurface <= 2) {
      if (y < SEA_LEVEL + 2) {
        return BlockType.SAND;
      } else if (isMountain) {
        return BlockType.COBBLESTONE;
      } else {
        return BlockType.GRASS;
      }
    }
    // second layer (3 , 5)
    else if (distFromSurface <= 5) {
      if (erosion <= -0.3 && pv >= 0) {
        return BlockType.COBBLESTONE;
      } else {
        return BlockType.DIRT;
      }
    }

    return BlockType.COBBLESTONE;
  }

  // private generateBlockBelowSurface(
  //   x: number,
  //   y: number,
  //   z: number,
  //   surfaceHeight: number
  // ) {
  //   const pv = this.terrainMap.getPV(x, z);

  //   if (pv <= -0.6 || pv >= 0.5) {
  //     return BlockType.COBBLESTONE;
  //   }

  //   if (Math.abs(y - surfaceHeight) < 1) {
  //     if (y < SEA_LEVEL + 2) {
  //       return BlockType.SAND;
  //     } else {
  //       return BlockType.GRASS;
  //     }
  //   }

  //   return BlockType.GRASS;
  // }

  private generateBlockAboveSurface(y: number, surfaceHeight: number) {
    if (y < SEA_LEVEL) {
      return BlockType.WATER;
    }

    return BlockType.AIR;
  }
}
