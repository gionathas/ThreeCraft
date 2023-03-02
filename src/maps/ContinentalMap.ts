import World from "../terrain/World";
import { Noise2DMap } from "./Noise2DMap";
import TestingMap from "./TestingMap";

export type ContinentalType =
  | "Ocean"
  | "Coast"
  | "Near_Inland"
  | "Inland"
  | "Far_Inland";

/**
 * This Map is used for generating the terrain base height
 */
export default class ContinentalMap extends Noise2DMap {
  static readonly NoiseRange: Record<ContinentalType, [number, number]> = {
    Ocean: [-1, -0.7],
    Coast: [-0.7, -0.4],
    Near_Inland: [-0.4, 0],
    Inland: [0, 0.7],
    Far_Inland: [0.7, 1],
  };

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

  static getType(continentalness: number): ContinentalType {
    if (continentalness <= ContinentalMap.NoiseRange.Ocean[1]) {
      return "Ocean";
    }
    if (continentalness <= ContinentalMap.NoiseRange.Coast[1]) {
      return "Coast";
    }
    if (continentalness <= ContinentalMap.NoiseRange.Near_Inland[1]) {
      return "Near_Inland";
    }
    if (continentalness <= ContinentalMap.NoiseRange.Inland[1]) {
      return "Inland";
    }
    return "Far_Inland";
  }
}
