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
    const surfaceY = this.terrainShapeMap.getSurfaceHeightAt(x, z);

    if (y < World.SEA_LEVEL) {
      return BlockType.WATER;
    }

    //TODO add trees

    return BlockType.AIR;
  }
}
