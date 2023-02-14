import { PV_BASE_SCALE } from "../config/constants";
import { lerp } from "../utils/helpers";
import { NoiseMap } from "./NoiseMap";

export default class PVMap extends NoiseMap {
  constructor(seed: string) {
    super(seed);
  }

  getPV(x: number, z: number, erosion: number = 0) {
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
        this.noise((x / scale) * frequency, (z / scale) * frequency) *
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

    if (erosion <= -0.8) {
      return lerp(lowScale, baseScale, (erosion + 1) / 0.2);
    }

    return baseScale;
  }
}
