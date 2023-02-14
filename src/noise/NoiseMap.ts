import alea from "alea";
import { createNoise2D, NoiseFunction2D } from "simplex-noise";

export abstract class NoiseMap {
  protected noise: NoiseFunction2D;
  protected cache: Record<string, number>;

  constructor(seed: string) {
    this.noise = createNoise2D(alea(seed));
    this.cache = {};
  }

  protected getCacheValue(x: number, z: number) {
    const key = this.getCacheKey(x, z);
    return this.cache[key];
  }

  protected setCacheValue(x: number, z: number, val: number) {
    const key = this.getCacheKey(x, z);
    this.cache[key] = val;
  }

  private getCacheKey(x: number, z: number) {
    return `${Math.floor(x)},${Math.floor(z)}`;
  }

  get _cacheSize() {
    return Object.keys(this.cache).length;
  }
}
