import AbstractMap from "./AbstractMap";
import ContinentalMap from "./ContinentalMap";
import ErosionMap from "./ErosionMap";
import HeightMap from "./HeightMap";
import PVMap from "./PVMap";
import TreeMap from "./TreeMap";

export default class TerrainMap extends AbstractMap {
  private continentalMap: ContinentalMap;
  private erosionMap: ErosionMap;
  private pvMap: PVMap;
  private heightMap: HeightMap;
  private treeMap: TreeMap;

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
    this.treeMap = new TreeMap(seed);
  }

  hasTree(x: number, z: number) {
    return this.treeMap.hasTree(x, z);
  }

  getSurfaceHeight(x: number, z: number) {
    return this.heightMap.getSurfaceHeight(x, z);
  }

  getContinentalness(x: number, z: number): number {
    return this.continentalMap.getContinentalness(x, z);
  }

  getErosion(x: number, z: number): number {
    return this.erosionMap.getErosion(x, z);
  }

  getPV(x: number, z: number, erosion?: number): number {
    return this.pvMap.getPV(x, z, erosion);
  }
}
