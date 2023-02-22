import AbstractMap from "./AbstractMap";

export default abstract class Abstract2DMap extends AbstractMap {
  private cache: Map<string, number>;

  constructor(seed: string) {
    super(seed);
    this.cache = new Map();
  }

  protected getCacheValue(x: number, z: number) {
    const key = this.getCacheKey(x, z);
    return this.cache.get(key);
  }

  protected setCacheValue(x: number, z: number, val: number) {
    const key = this.getCacheKey(x, z);
    this.cache.set(key, val);
  }

  protected getCacheKey(x: number, z: number) {
    return `${Math.floor(x)},${Math.floor(z)}`;
  }
}
