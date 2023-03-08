import World from "../terrain/World";
import { ValueRange } from "../utils/helpers";
import { Map2D } from "./AbstractMap";
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
export default class ContinentalMap extends Noise2DMap implements Map2D {
  static readonly NoiseRange: Record<ContinentalType, ValueRange> = {
    Ocean: { min: -1, max: -0.7 },
    Coast: { min: -0.7, max: -0.4 },
    Near_Inland: { min: -0.4, max: 0 },
    Inland: { min: 0, max: 0.6 },
    Far_Inland: { min: 0.6, max: 1 },
  };

  constructor(seed: string) {
    super(seed);
  }

  getValueAt(x: number, z: number): number {
    return this.getContinentalnessAt(x, z);
  }

  private getContinentalnessAt(x: number, z: number) {
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
    if (continentalness <= ContinentalMap.NoiseRange.Ocean.max) {
      return "Ocean";
    }
    if (continentalness <= ContinentalMap.NoiseRange.Coast.max) {
      return "Coast";
    }
    if (continentalness <= ContinentalMap.NoiseRange.Near_Inland.max) {
      return "Near_Inland";
    }
    if (continentalness <= ContinentalMap.NoiseRange.Inland.max) {
      return "Inland";
    }
    return "Far_Inland";
  }
}
