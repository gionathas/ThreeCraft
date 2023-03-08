import ContinentalMap, { ContinentalType } from "../../../maps/ContinentalMap";
import ErosionMap, { ErosionType } from "../../../maps/ErosionMap";
import PVMap, { PVType } from "../../../maps/PVMap";
import TerrainMap from "../../../maps/TerrainMap";
import { BlockType } from "../BlockType";

export default abstract class BlockGenerator {
  protected terrainMap: TerrainMap;

  constructor(terrainMap: TerrainMap) {
    this.terrainMap = terrainMap;
  }

  abstract generateBlock(x: number, y: number, z: number): BlockType | null;

  protected getSurfaceHeightAt(x: number, z: number): number {
    return this.terrainMap.getSurfaceHeightAt(x, z);
  }

  protected getContinentalTypeAt(x: number, z: number): ContinentalType {
    const continentalness = this.terrainMap.getContinentalnessAt(x, z);
    return ContinentalMap.getType(continentalness);
  }

  protected getPvTypeAt(x: number, z: number): PVType {
    const pv = this.terrainMap.getPVAt(x, z);
    return PVMap.getType(pv);
  }

  protected getErosionTypeAt(x: number, z: number): ErosionType {
    const erosion = this.terrainMap.getErosionAt(x, z);
    return ErosionMap.getType(erosion);
  }
}
