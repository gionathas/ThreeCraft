import World from "../terrain/World";
import { Noise2DMap } from "./Noise2DMap";
import TestingMap from "./TestingMap";

export type PVType = "Valley" | "Low" | "Plateau" | "Mid" | "High" | "Peak";

export default class PVMap extends Noise2DMap {
  static readonly NoiseRange: Record<PVType, [number, number]> = {
    Valley: [-1, -0.7],
    Low: [-0.7, -0.4],
    Plateau: [-0.4, -0.1],
    Mid: [-0.1, 0.4],
    High: [0.4, 0.8],
    Peak: [0.8, 1],
  };

  constructor(seed: string) {
    super(seed);
  }

  getPVAt(x: number, z: number, erosion: number = 0) {
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
    if (pv <= PVMap.NoiseRange.Valley[1]) {
      return "Valley";
    }

    if (pv <= PVMap.NoiseRange.Low[1]) {
      return "Low";
    }

    if (pv <= PVMap.NoiseRange.Plateau[1]) {
      return "Plateau";
    }

    if (pv <= PVMap.NoiseRange.Mid[1]) {
      return "Mid";
    }

    if (pv <= PVMap.NoiseRange.High[1]) {
      return "High";
    }

    return "Peak";
  }
}
