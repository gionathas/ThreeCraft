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
  continentalness: 0,
  erosion: -1,
  // pv: -1,
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

  getSurfaceHeight(x: number, z: number) {
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

    const lowSlope = min + 6; // 6
    const midSlope = lowSlope * 2; // 12
    const highSlope = midSlope * 2; // 24

    const lowPeak = Math.floor(max * (1 / 3));

    // high erosion, mostly flat terrain
    if (erosion >= 0.5) {
      const t = (erosion - 1) / -0.5;
      return lerp(min, lowSlope, t);
    }
    // gentle hill/valley ridge
    else if (erosion >= 0.4 && erosion < 0.5) {
      const t = (erosion - 0.5) / -0.1;
      return lerp(lowSlope, lowPeak, t);
    }
    // gentle hill/valley plateau
    else if (erosion >= 0.3 && erosion < 0.4) {
      return lowPeak;
    }
    // gentle hill/valley ridge
    else if (erosion >= 0.2 && erosion < 0.3) {
      const t = (erosion - 0.2) / 0.1;
      return lerp(lowSlope, lowPeak, t);
    }
    // mostly flat
    else if (erosion >= -0.1 && erosion < 0.2) {
      const t = (erosion - 0.2) / -0.3;
      return lerp(lowSlope, midSlope, t);
    }
    // mid low erosion
    else if (erosion >= -0.5 && erosion < -0.1) {
      const t = (erosion + 0.1) / -0.4;
      return lerp(midSlope, highSlope, t);
    }
    // very low erosion
    else {
      const t = (erosion + 0.5) / -0.5;
      return lerp(highSlope, max, t);
    }
  }

  private getPvHeight(pv: number, erosionHeight: number) {
    const min = Math.round(-erosionHeight * (2 / 3));
    const mid = Math.round(-erosionHeight / 4);
    const peak = erosionHeight;

    // flat valley area
    if (pv <= -0.7) {
      return min;
    }
    // valley
    else if (pv > -0.7 && pv < -0.4) {
      const t = (pv + 0.7) / 0.3;
      return lerp(min, mid, t);
    }
    // small flat area between a valley and an hill
    else if (pv >= -0.4 && pv < -0.1) {
      const t = (pv + 0.4) / 0.2;
      return lerp(mid, mid + 2, t);
    }
    // hill
    else if (pv >= -0.1 && pv < 0.8) {
      const t = (pv + 0.1) / 0.9;
      return lerp(mid + 2, peak, t);
    }
    // peak flat
    else {
      return peak;
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

  getPV(x: number, z: number, erosion?: number): number {
    if (TEST_MAP_ENABLED && TestMap.pv != null) {
      return TestMap.pv;
    }

    return this.pvMap.getPV(x, z, erosion);
  }
}
