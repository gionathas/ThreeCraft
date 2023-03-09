import World from "../terrain/World";
import { ValueRange } from "../utils/helpers";
import { Map2D } from "./AbstractMap";
import { Noise2DMap } from "./Noise2DMap";
import TestingMap from "./TestingMap";

export type PVType = "Valley" | "Low" | "Plateau" | "Mid" | "High" | "Peak";

export default class PVMap extends Noise2DMap implements Map2D {
  static readonly NoiseRange: Record<PVType, ValueRange> = {
    Valley: { min: -1, max: -0.7 },
    Low: { min: -0.7, max: -0.4 },
    Plateau: { min: -0.4, max: -0.1 },
    Mid: { min: -0.1, max: 0.4 },
    High: { min: 0.4, max: 0.8 },
    Peak: { min: 0.8, max: 1 },
  };

  constructor(seed: string) {
    super(seed);
  }

  setValueAt(x: number, z: number, value: number): number {
    return this.setPointData(x, z, value);
  }

  getValueAt(x: number, z: number): number {
    return this.getPVAt(x, z);
  }

  private getPVAt(x: number, z: number) {
    if (TestingMap.ENABLED && TestingMap.PV != null) {
      return TestingMap.PV;
    }

    const cachedValue = this.getPointData(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const octaves = 4;
    const persistence = 0.5;
    const scale = World.PV_BASE_SCALE;

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

    this.setPointData(x, z, pv);
    return pv;
  }

  static getType(pv: number): PVType {
    if (pv <= PVMap.NoiseRange.Valley.max) {
      return "Valley";
    }

    if (pv <= PVMap.NoiseRange.Low.max) {
      return "Low";
    }

    if (pv <= PVMap.NoiseRange.Plateau.max) {
      return "Plateau";
    }

    if (pv <= PVMap.NoiseRange.Mid.max) {
      return "Mid";
    }

    if (pv <= PVMap.NoiseRange.High.max) {
      return "High";
    }

    return "Peak";
  }
}
