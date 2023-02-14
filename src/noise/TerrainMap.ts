import {
  CONTINENTALNESS_MAX_HEIGHT,
  CONTINENTALNESS_MIN_HEIGHT,
  MAX_EROSION,
  MIN_EROSION,
  TEST_MAP_ENABLED,
} from "../config/constants";
import { lerp } from "../utils/helpers";
import ContinentalMap from "./ContinentalMap";
import ErosionMap from "./ErosionMap";
import { NoiseMap } from "./NoiseMap";
import PVMap from "./PVMap";

type TestMap = {
  continentalness?: number;
  erosion?: number;
  pv?: number;
};

const TestMap: TestMap = {
  continentalness: -1,
  erosion: -1,
  // pv: 1,
};

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

    const continentalness = this.getContinentalness(x, z);
    const baseHeight = this.getBaseHeight(continentalness);

    const erosion = this.getErosion(x, z);
    const erosionFactor = this.getErosionFactor(erosion);

    const pv = this.getPV(x, z, erosion);
    const pvHeight = this.getPvHeight(pv, erosionFactor);

    const height = baseHeight + pvHeight;

    this.setCacheValue(x, z, height);
    return height;
  }

  private getBaseHeight(continentalness: number) {
    return lerp(
      CONTINENTALNESS_MIN_HEIGHT,
      CONTINENTALNESS_MAX_HEIGHT,
      (continentalness + 1) / 2
    );
  }

  // high erosion -> flat terrain
  // low erosion -> steep terrain
  private getErosionFactor(erosion: number) {
    const min = MIN_EROSION;
    const max = MAX_EROSION;

    const step1 = min + 9;
    const step2 = step1 + 15;

    // high erosion
    if (erosion >= 0) {
      const t = (erosion - 1) / -1;
      return lerp(min, step1, t);
    }
    // mid low erosion
    else if (erosion >= -0.5 && erosion < 0) {
      const t = erosion / -0.5;
      return lerp(step1, step2, t);
    }
    // very low erosion
    else {
      const t = (erosion + 0.5) / -0.5;
      return lerp(step2, max, t);
    }
  }

  private getPvHeight(pv: number, erosionHeight: number) {
    // valley
    if (pv <= -0.1) {
      const t = (pv + 1) / 0.9;
      return lerp(-erosionHeight, -erosionHeight / 4, t);
    }
    // small flat area between a valley and an hill
    else if (pv > -0.1 && pv < 0.1) {
      return -erosionHeight / 4;
    }
    // hill
    else {
      const t = (pv - 0.1) / 0.9;
      return lerp(-erosionHeight / 4, erosionHeight, t);
    }
  }

  getContinentalness(x: number, z: number): number {
    if (TEST_MAP_ENABLED && TestMap.continentalness != null) {
      return TestMap.continentalness;
    }

    return this.continentalMap.getContinentalness(x, z);
  }

  getErosion(x: number, z: number): number {
    if (TEST_MAP_ENABLED && TestMap.erosion != null) {
      return TestMap.erosion;
    }
    return this.erosionMap.getErosion(x, z);
  }

  getPV(x: number, z: number, erosion: number): number {
    if (TEST_MAP_ENABLED && TestMap.pv != null) {
      return TestMap.pv;
    }

    return this.pvMap.getPV(x, z, erosion);
  }
}
