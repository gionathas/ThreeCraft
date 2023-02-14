import { CONTINENTALNESS_NOISE_SCALE } from "../config/constants";
import { NoiseMap } from "./NoiseMap";

/**
 * This class is used for generating the height map for the terrain
 */
export default class ContinentalMap extends NoiseMap {
  constructor(seed: string) {
    super(seed);
  }

  getContinentalness(x: number, z: number) {
    const cachedValue = this.getCacheValue(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const continentalness = this.noise(
      x / CONTINENTALNESS_NOISE_SCALE,
      z / CONTINENTALNESS_NOISE_SCALE
    );

    this.setCacheValue(x, z, continentalness);
    return continentalness;
  }
}
