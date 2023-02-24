import {
  EROSION_NOISE_SCALE,
  TESTING_MAP_ENABLED,
  TESTING_MAP_EROSION,
} from "../config/constants";
import { Noise2DMap } from "./Noise2DMap";

export default class ErosionMap extends Noise2DMap {
  constructor(seed: string) {
    super(seed);
  }

  getErosion(x: number, z: number) {
    if (TESTING_MAP_ENABLED && TESTING_MAP_EROSION != null) {
      return TESTING_MAP_EROSION;
    }

    const cachedValue = this.getPointData(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const erosion = this.noise2D(
      x / EROSION_NOISE_SCALE,
      z / EROSION_NOISE_SCALE
    );

    this.setPointData(x, z, erosion);
    return erosion;
  }
}
