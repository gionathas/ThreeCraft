import AbstractMap, { Map2D, Map3D } from "../AbstractMap";

export default class TerrainMap extends AbstractMap {
  private continentalMap: Map2D;
  private erosionMap: Map2D;
  private pvMap: Map2D;
  private heightMap: Map2D;
  private densityMap: Map3D;

  constructor(
    seed: string,
    continentalMap: Map2D,
    erosionMap: Map2D,
    pvMap: Map2D,
    heightMap: Map2D,
    densityMap: Map3D
  ) {
    super(seed);
    this.continentalMap = continentalMap;
    this.erosionMap = erosionMap;
    this.pvMap = pvMap;
    this.heightMap = heightMap;
    this.densityMap = densityMap;
  }

  getSurfaceHeightAt(x: number, z: number) {
    return this.heightMap.getValueAt(x, z);
  }

  getContinentalnessAt(x: number, z: number): number {
    return this.continentalMap.getValueAt(x, z);
  }

  getErosionAt(x: number, z: number): number {
    return this.erosionMap.getValueAt(x, z);
  }

  getPVAt(x: number, z: number): number {
    return this.pvMap.getValueAt(x, z);
  }

  getDensityAt(x: number, y: number, z: number): number {
    return this.densityMap.getValueAt(x, y, z);
  }

  getHeightMap() {
    return this.heightMap;
  }
}
