import { TerrainMap } from "../../../maps/terrain";
import { TreeMap } from "../../../maps/tree";
import World from "../../World";
import { BlockType } from "../BlockType";
import BlockGenerator from "./BlockGenerator";

export default class FeaturesGenerator extends BlockGenerator {
  protected treeMap: TreeMap;

  constructor(terrainMap: TerrainMap, treeMap: TreeMap) {
    super(terrainMap);
    this.treeMap = treeMap;
  }

  generateBlock(x: number, y: number, z: number): BlockType | null {
    const surfaceY = this.getSurfaceHeightAt(x, z);

    if (y < surfaceY) {
      return null;
    }

    if (this.shouldSpawnWater(x, y, z)) {
      return BlockType.WATER;
    }

    if (this.treeMap.shouldSpawnTreeTrunkAt(x, y, z, surfaceY)) {
      return BlockType.OAK_LOG;
    }

    if (this.treeMap.shouldSpawnTreeLeafAt(x, y, z)) {
      return BlockType.OAK_LEAVES;
    }

    if (this.shouldSpawnCloud(x, y, z)) {
      return BlockType.CLOUD;
    }

    return BlockType.AIR;
  }

  private shouldSpawnWater(x: number, y: number, z: number): boolean {
    return y < World.SEA_LEVEL;
  }

  private shouldSpawnCloud(x: number, y: number, z: number): boolean {
    const dist = Math.floor(Math.random() * 6) + 1;

    const isIdealHeight = y > World.CLOUD_LEVEL && y <= World.CLOUD_LEVEL + 1;
    const isSpawnableArea =
      Math.ceil(x / World.CLOUD_WIDTH) % dist === 0 &&
      Math.ceil(z / World.CLOUD_DEPTH) % dist === 0;

    return isIdealHeight && isSpawnableArea;
  }
}
