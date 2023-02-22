import { SEA_LEVEL } from "../config/constants";
import WorldMap from "../noise/WorldMap";
import { Coordinate } from "../utils/helpers";
import { BlockType } from "./Block";
import Chunk from "./Chunk";

type ChunkBoundaries = {
  upper: number;
  bottom: number;
  right: number;
  left: number;
  front: number;
  back: number;
};

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
  private worldMap: WorldMap;

  constructor(worldMap: WorldMap) {
    this.worldMap = worldMap;
  }

  fillChunk(chunk: Chunk, { x: startX, y: startY, z: startZ }: Coordinate) {
    const chunkWidth = chunk.width;
    const chunkHeight = chunk.height;

    const endX = startX + chunkWidth;
    const endZ = startZ + chunkWidth;
    const endY = startY + chunkHeight;

    // const boundaries = {
    //   bottom: startY,
    //   upper: startY + chunkHeight,
    //   front: startZ,
    //   back: startZ + chunkWidth,
    //   left: startX,
    //   right: startX + chunkWidth,
    // };

    // filling the chunk with blocks from bottom to top
    for (let y = startY; y < endY; y++) {
      for (let z = startZ; z < endZ; z++) {
        for (let x = startX; x < endX; x++) {
          const blockCoord = { x, y, z };

          const surfaceY = this.worldMap.getSurfaceHeight(x, z);
          this.generateBlock(chunk, blockCoord, surfaceY);
        }
      }
    }
  }

  private generateBlock(
    chunk: Chunk,
    blockCoord: Coordinate,
    surfaceY: number
    // boundaries: ChunkBoundaries
  ) {
    if (blockCoord.y < surfaceY) {
      this.generateBlockBelowSurface(
        chunk,
        blockCoord,
        surfaceY
        // boundaries
      );
    } else {
      this.generateBlockAboveSurface(
        chunk,
        blockCoord,
        surfaceY
        // boundaries
      );
    }
  }

  private generateBlockBelowSurface(
    chunk: Chunk,
    blockCoord: Coordinate,
    surfaceY: number
    // boundaries: ChunkBoundaries
  ) {
    const { x, y, z } = blockCoord;
    const distFromSurface = Math.abs(y - surfaceY);
    const pv = this.worldMap.getPV(x, z);
    const erosion = this.worldMap.getErosion(x, z);

    const isMountain = pv >= 0.5;

    let blockType: BlockType = BlockType.COBBLESTONE;

    // first layer (0 - 1)
    if (distFromSurface <= 1) {
      if (y < SEA_LEVEL + 2) {
        blockType = BlockType.SAND;
      } else if (isMountain) {
        blockType = BlockType.COBBLESTONE;
      } else {
        blockType = BlockType.GRASS;
      }
    }
    // second layer (2 , 5)
    else if (distFromSurface <= 5) {
      if (erosion <= -0.3 && pv >= 0) {
        blockType = BlockType.COBBLESTONE;
      } else {
        blockType = BlockType.DIRT;
      }
    }

    // add the block inside the chunk
    chunk.setBlock(blockCoord, blockType);
  }

  private generateBlockAboveSurface(
    chunk: Chunk,
    blockCoord: Coordinate,
    surfaceY: number
    // boundaries: ChunkBoundaries
  ) {
    const { x, y, z } = blockCoord;

    let blockType: BlockType = BlockType.AIR;

    if (y < SEA_LEVEL) {
      blockType = BlockType.WATER;
    } else {
      const treeMap = this.worldMap.getTreeMap();

      if (treeMap.isTreeTrunk(x, y, z, surfaceY)) {
        blockType = BlockType.OAK_LOG;
      }
    }

    // add the block inside the chunk
    chunk.setBlock(blockCoord, blockType);
  }
}
