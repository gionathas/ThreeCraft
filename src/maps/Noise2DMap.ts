import { createNoise2D, NoiseFunction2D } from "simplex-noise";
import Local2DMap from "./Local2DMap";

export abstract class Noise2DMap extends Local2DMap {
  protected noise2D: NoiseFunction2D;

  constructor(seed: string) {
    super(seed);
    this.noise2D = createNoise2D(this.prng);
  }
}
