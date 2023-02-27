import World from "../terrain/World";
import { Noise2DMap } from "./Noise2DMap";
import TestingMap from "./TestingMap";

export default class ErosionMap extends Noise2DMap {
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
}
