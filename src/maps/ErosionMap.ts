import World from "../terrain/World";
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
  static readonly NoiseRange: Record<ErosionType, [number, number]> = {
    VeryLow: [-1, -0.5],
    Low: [-0.5, -0.1],
    Mid: [-0.1, 0.3],
    MidSpike: [0.3, 0.4],
    MidLow: [0.4, 0.6],
    FlatSpike: [0.6, 0.7],
    Flat: [0.7, 1],
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
    if (erosion <= ErosionMap.NoiseRange.VeryLow[1]) {
      return "VeryLow";
    }
    if (erosion <= ErosionMap.NoiseRange.Low[1]) {
      return "Low";
    }
    if (erosion <= ErosionMap.NoiseRange.Mid[1]) {
      return "Mid";
    }
    if (erosion <= ErosionMap.NoiseRange.MidSpike[1]) {
      return "MidSpike";
    }
    if (erosion <= ErosionMap.NoiseRange.MidLow[1]) {
      return "MidLow";
    }
    if (erosion <= ErosionMap.NoiseRange.FlatSpike[1]) {
      return "FlatSpike";
    }

    return "Flat";
  }
}
