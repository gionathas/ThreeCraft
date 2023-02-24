import AbstractMap from "./AbstractMap";
import ContinentalMap from "./ContinentalMap";
import ErosionMap from "./ErosionMap";
import HeightMap from "./HeightMap";
import PVMap from "./PVMap";

export default class TerrainShapeMap extends AbstractMap {
  private continentalMap: ContinentalMap;
  private erosionMap: ErosionMap;
  private pvMap: PVMap;
  private heightMap: HeightMap;

  constructor(seed: string) {
    super(seed);
    this.continentalMap = new ContinentalMap(seed + "_continental");
    this.erosionMap = new ErosionMap(seed + "_erosion");
    this.pvMap = new PVMap(seed + "_pv");
    this.heightMap = new HeightMap(
      seed + "_height",
      this.continentalMap,
      this.erosionMap,
      this.pvMap
    );
  }

  getSurfaceHeightAt(x: number, z: number) {
    return this.heightMap.getSurfaceHeightAt(x, z);
  }

  getContinentalnessAt(x: number, z: number): number {
    return this.continentalMap.getContinentalnessAt(x, z);
  }

  getErosionAt(x: number, z: number): number {
    return this.erosionMap.getErosionAt(x, z);
  }

  getPVAt(x: number, z: number, erosion?: number): number {
    return this.pvMap.getPVAt(x, z, erosion);
  }

  getHeightMap() {
    return this.heightMap;
  }
}
