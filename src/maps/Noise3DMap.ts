import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import Local3DMap from "./Local3DMap";

export abstract class Noise3DMap extends Local3DMap {
  protected noise3D: NoiseFunction3D;

  constructor(seed: string) {
    super(seed);
    this.noise3D = createNoise3D(this.prng);
  }
}
