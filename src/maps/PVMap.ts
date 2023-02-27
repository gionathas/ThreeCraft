import World from "../terrain/World";
import { Noise2DMap } from "./Noise2DMap";
import TestingMap from "./TestingMap";

export default class PVMap extends Noise2DMap {
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
}
