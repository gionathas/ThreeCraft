import TerrainShapeMap from "../../../maps/TerrainShapeMap";
import { TreeMap } from "../../../maps/tree";
import BlockGenerator from "./BlockGenerator";
import SurfaceBlockGenerator from "./SurfaceBlockGenerator";
import UndergroundBlockGenerator from "./UndergroundBlockGenerator";

export default class BlockGeneratorFactory {
  private terrainShapeMap: TerrainShapeMap;

  // generators
  private undergroundBlockGenerator: UndergroundBlockGenerator;
  private surfaceBlockGenerator: SurfaceBlockGenerator;

  constructor(terrainShapeMap: TerrainShapeMap, treeMap: TreeMap) {
    this.terrainShapeMap = terrainShapeMap;

    this.undergroundBlockGenerator = new UndergroundBlockGenerator(
      terrainShapeMap
    );
    this.surfaceBlockGenerator = new SurfaceBlockGenerator(
      terrainShapeMap,
      treeMap
    );
  }

  getBlockGenerator(x: number, y: number, z: number): BlockGenerator {
    const surfaceY = this.terrainShapeMap.getSurfaceHeightAt(x, z);

    if (y < surfaceY) {
      return this.undergroundBlockGenerator;
    } else {
      return this.surfaceBlockGenerator;
    }
  }
}
