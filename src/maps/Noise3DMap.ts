import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import Abstract3DMap from "./Abstract3DMap";

export abstract class Noise3DMap extends Abstract3DMap {
  protected noise3D: NoiseFunction3D;

  constructor(seed: string) {
    super(seed);
    this.noise3D = createNoise3D(this.prng);
  }
}
