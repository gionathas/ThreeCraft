import EnvVars from "../../config/EnvVars";
import TerrainShapeMap from "../../maps/TerrainShapeMap";
import { TreeMap } from "../../maps/tree";
import { Coordinate } from "../../utils/helpers";
import { BlockType } from "../block";
import World from "../World";
import Chunk from "./Chunk";

/**
 * //TODO implement factory pattern
 */
export default class ChunkDecorator {
  private terrainShapeMap: TerrainShapeMap;
  private treeMap: TreeMap;

  constructor(terrainShapeMap: TerrainShapeMap, treeMap: TreeMap) {
    this.terrainShapeMap = terrainShapeMap;
    this.treeMap = treeMap;
  }

  decorateChunk(chunk: Chunk) {
    const { x: startX, y: startY, z: startZ } = chunk.getWorldOriginPosition();
    const endX = startX + Chunk.WIDTH;
    const endY = startY + Chunk.HEIGHT;
    const endZ = startZ + Chunk.WIDTH;

    // filling the chunk with blocks from bottom to top
    for (let y = startY; y < endY; y++) {
      for (let z = startZ; z < endZ; z++) {
        for (let x = startX; x < endX; x++) {
          const blockCoord = { x, y, z };

          const surfaceY = this.terrainShapeMap.getSurfaceHeightAt(x, z);
          this.generateBlock(chunk, blockCoord, surfaceY);
        }
      }
    }
  }

  private generateBlock(
    chunk: Chunk,
    blockCoord: Coordinate,
    surfaceY: number
  ) {
    if (blockCoord.y < surfaceY) {
      this.generateBlockBelowSurface(chunk, blockCoord, surfaceY);
    } else {
      this.generateBlockAboveSurface(chunk, blockCoord, surfaceY);
    }
  }

  private generateBlockBelowSurface(
    chunk: Chunk,
    blockCoord: Coordinate,
    surfaceY: number
  ) {
    const { x, y, z } = blockCoord;
    const pv = this.terrainShapeMap.getPVAt(x, z);
    const erosion = this.terrainShapeMap.getErosionAt(x, z);
    const depth = Math.abs(y - surfaceY);

    const isMountain = pv >= 0.5;

    let blockType: BlockType = BlockType.STONE;

    // first layer (0 - 1)
    if (depth <= 1) {
      if (y < World.SEA_LEVEL + 2) {
        blockType = BlockType.SAND;
      } else if (isMountain) {
        blockType = BlockType.STONE;
      } else {
        blockType = BlockType.GRASS;
      }
    }
    // second layer (2 , 5)
    else if (depth <= 5) {
      if (erosion <= -0.3 && pv >= 0) {
        blockType = BlockType.STONE;
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
  ) {
    const { x, y, z } = blockCoord;

    let blockType: BlockType = BlockType.AIR;

    if (y < World.SEA_LEVEL) {
      blockType = BlockType.WATER;
    } else {
      if (EnvVars.TREE_GENERATION_ENABLED) {
        if (this.treeMap.shouldSpawnTreeTrunkAt(x, y, z, surfaceY)) {
          blockType = BlockType.OAK_LOG;
        } else if (this.treeMap.shouldSpawnTreeLeafAt(x, y, z, surfaceY)) {
          blockType = BlockType.OAK_LEAVES;
        }
      }
    }

    // add the block inside the chunk
    chunk.setBlock(blockCoord, blockType);
  }
}
