import TerrainShapeMap from "../../../maps/TerrainShapeMap";
import { TreeMap } from "../../../maps/tree";
import World from "../../World";
import { BlockType } from "../BlockType";
import BlockGenerator from "./BlockGenerator";

export default class SurfaceBlockGenerator extends BlockGenerator {
  protected treeMap: TreeMap;

  constructor(terrainShapeMap: TerrainShapeMap, treeMap: TreeMap) {
    super(terrainShapeMap);
    this.treeMap = treeMap;
  }

  generateBlock(x: number, y: number, z: number): BlockType {
    if (this.shouldSpawnWater2(x, y, z)) {
      return BlockType.WATER;
    }

    //TODO add trees

    return BlockType.AIR;
  }

  private shouldSpawnWater2(x: number, y: number, z: number): boolean {
    return y < World.SEA_LEVEL;
  }
}
