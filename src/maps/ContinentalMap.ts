import World from "../terrain/World";
import { Noise2DMap } from "./Noise2DMap";
import TestingMap from "./TestingMap";

export type ContinentalnessType =
  | "Ocean"
  | "Coast"
  | "Near Inland"
  | "Inland"
  | "Far Inland";

/**
 * This Map is used for generating the terrain base height
 */
export default class ContinentalMap extends Noise2DMap {
  constructor(seed: string) {
    super(seed);
  }

  getContinentalnessAt(x: number, z: number) {
    if (TestingMap.ENABLED && TestingMap.CONTINENTALNESS != null) {
      return TestingMap.CONTINENTALNESS;
    }

    const cachedValue = this.getPointData(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const continentalness = this.noise2D(
      x / World.CONTINENTALNESS_NOISE_SCALE,
      z / World.CONTINENTALNESS_NOISE_SCALE
    );

    this.setPointData(x, z, continentalness);
    return continentalness;
  }
}
