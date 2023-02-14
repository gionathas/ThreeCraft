import { EROSION_NOISE_SCALE } from "../config/constants";
import { NoiseMap } from "./NoiseMap";

export default class ErosionMap extends NoiseMap {
  constructor(seed: string) {
    super(seed);
  }

  getErosion(x: number, z: number) {
    const cachedValue = this.getCacheValue(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const erosion = this.noise(
      x / EROSION_NOISE_SCALE,
      z / EROSION_NOISE_SCALE
    );

    this.setCacheValue(x, z, erosion);
    return erosion;
  }
}
