import TerrainShapeMap from "../../../maps/TerrainShapeMap";
import { BlockType } from "../BlockType";

export default abstract class BlockGenerator {
  protected terrainShapeMap: TerrainShapeMap;

  constructor(terrainShapeMap: TerrainShapeMap) {
    this.terrainShapeMap = terrainShapeMap;
  }

  abstract generateBlock(x: number, y: number, z: number): BlockType;
}
