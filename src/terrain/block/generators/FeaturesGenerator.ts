import TerrainMap from "../../../maps/TerrainMap";
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

    return BlockType.AIR;
  }

  private shouldSpawnWater(x: number, y: number, z: number): boolean {
    return y < World.SEA_LEVEL;
  }
}
