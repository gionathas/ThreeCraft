import AbstractMap, { MapData } from "./AbstractMap";

export default abstract class Abstract2DMap extends AbstractMap {
  protected data: MapData;

  constructor(seed: string) {
    super(seed);
    this.data = new Map();
  }

  getData() {
    return this.data;
  }

  setData(data: MapData) {
    this.data = data;
  }

  protected getPointData(x: number, z: number): number | undefined {
    const key = Abstract2DMap.computeKey(x, z);
    return this.data.get(key);
  }

  protected setPointData(x: number, z: number, val: number) {
    const key = Abstract2DMap.computeKey(x, z);
    this.data.set(key, val);
    return val;
  }

  static computeKey(x: number, z: number) {
    return `${Math.floor(x)}_${Math.floor(z)}`;
  }
}
