import ContinentalMap from "./ContinentalMap";
import ErosionMap from "./ErosionMap";
import { NoiseMap } from "./NoiseMap";
import PVMap from "./PVMap";

export default class TerrainMap extends NoiseMap {
  private continentalMap: ContinentalMap;
  private erosionMap: ErosionMap;
  private pvMap: PVMap;

  constructor(seed: string) {
    super(seed);
    this.continentalMap = new ContinentalMap(seed + "-continental");
    this.erosionMap = new ErosionMap(seed + "-erosion");
    this.pvMap = new PVMap(seed + "-pv");
  }

  getHeight(x: number, z: number) {
    const cachedValue = this.getCacheValue(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const continentalness = this.continentalMap.getContinentalness(x, z);
    // const continentalness = 0;
    const baseHeight = this.getBaseHeight(continentalness);

    const pv = this.pvMap.getPV(x, z);
    const pvHeight = this.getPvHeight(pv);

    // const erosion = 1;
    const erosion = this.erosionMap.getErosion(x, z);
    let erosionHeight = this.getErosionHeight(erosion, pvHeight);
    // let erosionHeight = 0;

    // const height = baseHeight + this.noise(x / scale, z / scale) * amp;
    // const height = baseHeight + erosionHeight + pvHeight;

    const height = baseHeight + pvHeight + erosionHeight;

    this.setCacheValue(x, z, height);
    return height;
  }

  private getBaseHeight(continentalness: number) {
    return this.lerp(-30, 30, (continentalness + 1) / 2);
  }

  private getErosionHeight(erosion: number, pvHeight: number) {
    if (erosion >= 0) {
      const t = (erosion - 1) / -1;
      return this.lerp(-pvHeight, 0, t);
    } else {
      return 0;
    }
  }

  private getPvHeight(pv: number) {
    if (pv <= -0.5) {
      return this.lerp(0, 5, (pv + 1) / 0.5);
    } else if (pv > -0.7 && pv < 0) {
      return 5;
    } else {
      return this.lerp(5, 50, pv);
    }
  }

  getContinentalness(x: number, z: number) {
    return this.continentalMap.getContinentalness(x, z);
  }

  getErosion(x: number, z: number) {
    return this.erosionMap.getErosion(x, z);
  }

  getPV(x: number, z: number) {
    return this.pvMap.getPV(x, z);
  }

  private lerp(start: number, end: number, amount: number) {
    return start + (end - start) * amount;
  }
}
