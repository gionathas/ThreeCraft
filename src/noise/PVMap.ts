import {
  PV_BASE_SCALE,
  TESTING_MAP_ENABLED,
  TESTING_MAP_PV,
} from "../config/constants";
import { Noise2DMap } from "./Noise2DMap";

export default class PVMap extends Noise2DMap {
  constructor(seed: string) {
    super(seed);
  }

  getPV(x: number, z: number, erosion: number = 0) {
    if (TESTING_MAP_ENABLED && TESTING_MAP_PV != null) {
      return TESTING_MAP_PV;
    }

    const cachedValue = this.getCacheValue(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const octaves = 4;
    const persistence = 0.5;
    const scale = this.getNoiseScale(erosion);

    let pv = 0;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      const frequency = Math.pow(2, i);
      const amplitude = Math.pow(persistence, i);
      maxAmplitude += amplitude;
      pv +=
        this.noise2D((x / scale) * frequency, (z / scale) * frequency) *
        amplitude;
    }

    pv /= maxAmplitude;

    this.setCacheValue(x, z, pv);
    return pv;
  }

  /**
   * Higher scale means more stretched terrain,
   * whereas lower scale means more rough terrain
   */
  getNoiseScale(erosion: number) {
    const baseScale = PV_BASE_SCALE;
    const lowScale = baseScale - 20;

    // if (erosion <= -0.8) {
    //   return lerp(lowScale, baseScale, (erosion + 1) / 0.2);
    // }

    return baseScale;
  }
}
