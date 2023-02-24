import { createNoise2D, NoiseFunction2D } from "simplex-noise";
import Abstract2DMap from "./Abstract2DMap";

export abstract class Noise2DMap extends Abstract2DMap {
  protected noise2D: NoiseFunction2D;

  constructor(seed: string) {
    super(seed);
    this.noise2D = createNoise2D(this.prng);
  }
}
