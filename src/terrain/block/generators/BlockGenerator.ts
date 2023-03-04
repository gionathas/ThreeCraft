import ContinentalMap, { ContinentalType } from "../../../maps/ContinentalMap";
import ErosionMap, { ErosionType } from "../../../maps/ErosionMap";
import PVMap, { PVType } from "../../../maps/PVMap";
import TerrainShapeMap from "../../../maps/TerrainShapeMap";
import { BlockType } from "../BlockType";

export default abstract class BlockGenerator {
  protected terrainShapeMap: TerrainShapeMap;

  constructor(terrainShapeMap: TerrainShapeMap) {
    this.terrainShapeMap = terrainShapeMap;
  }

  abstract generateBlock(x: number, y: number, z: number): BlockType | null;

  protected getSurfaceHeightAt(x: number, z: number): number {
    return this.terrainShapeMap.getSurfaceHeightAt(x, z);
  }

  protected getContinentalTypeAt(x: number, z: number): ContinentalType {
    const continentalness = this.terrainShapeMap.getContinentalnessAt(x, z);
    return ContinentalMap.getType(continentalness);
  }

  protected getPvTypeAt(x: number, z: number): PVType {
    const pv = this.terrainShapeMap.getPVAt(x, z);
    return PVMap.getType(pv);
  }

  protected getErosionTypeAt(x: number, z: number): ErosionType {
    const erosion = this.terrainShapeMap.getErosionAt(x, z);
    return ErosionMap.getType(erosion);
  }
}
