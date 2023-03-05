import World from "../terrain/World";
import { ValueRange } from "../utils/helpers";
import { Noise2DMap } from "./Noise2DMap";
import TestingMap from "./TestingMap";

export type ErosionType =
  | "Flat"
  | "FlatSpike"
  | "MidLow"
  | "MidSpike"
  | "Mid"
  | "Low"
  | "VeryLow";
export default class ErosionMap extends Noise2DMap {
  static readonly NoiseRange: Record<ErosionType, ValueRange> = {
    VeryLow: { min: -1, max: -0.5 },
    Low: { min: -0.5, max: -0.1 },
    Mid: { min: -0.1, max: 0.3 },
    MidSpike: { min: 0.3, max: 0.4 },
    MidLow: { min: 0.4, max: 0.7 },
    FlatSpike: { min: 0.7, max: 0.8 },
    Flat: { min: 0.8, max: 1 },
  };

  constructor(seed: string) {
    super(seed);
  }

  getErosionAt(x: number, z: number) {
    if (TestingMap.ENABLED && TestingMap.EROSION != null) {
      return TestingMap.EROSION;
    }

    const cachedValue = this.getPointData(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const erosion = this.noise2D(
      x / World.EROSION_NOISE_SCALE,
      z / World.EROSION_NOISE_SCALE
    );

    this.setPointData(x, z, erosion);
    return erosion;
  }

  static getType(erosion: number): ErosionType {
    if (erosion <= ErosionMap.NoiseRange.VeryLow.max) {
      return "VeryLow";
    }
    if (erosion <= ErosionMap.NoiseRange.Low.max) {
      return "Low";
    }
    if (erosion <= ErosionMap.NoiseRange.Mid.max) {
      return "Mid";
    }
    if (erosion <= ErosionMap.NoiseRange.MidSpike.max) {
      return "MidSpike";
    }
    if (erosion <= ErosionMap.NoiseRange.MidLow.max) {
      return "MidLow";
    }
    if (erosion <= ErosionMap.NoiseRange.FlatSpike.max) {
      return "FlatSpike";
    }

    return "Flat";
  }
}
