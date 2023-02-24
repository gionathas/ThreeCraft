import {
  CONTINENTALNESS_NOISE_SCALE,
  TESTING_MAP_CONTINENTALNESS,
  TESTING_MAP_ENABLED,
} from "../config/constants";
import { Noise2DMap } from "./Noise2DMap";

/**
 * This Map is used for generating the terrain base height
 */
export default class ContinentalMap extends Noise2DMap {
  constructor(seed: string) {
    super(seed);
  }

  getContinentalness(x: number, z: number) {
    if (TESTING_MAP_ENABLED && TESTING_MAP_CONTINENTALNESS != null) {
      return TESTING_MAP_CONTINENTALNESS;
    }

    const cachedValue = this.getPointData(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const continentalness = this.noise2D(
      x / CONTINENTALNESS_NOISE_SCALE,
      z / CONTINENTALNESS_NOISE_SCALE
    );

    this.setPointData(x, z, continentalness);
    return continentalness;
  }
}
