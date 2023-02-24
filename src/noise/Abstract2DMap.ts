import AbstractMap from "./AbstractMap";

export type MapData = Record<string, number>;

export default abstract class Abstract2DMap extends AbstractMap {
  protected data: MapData;

  constructor(seed: string) {
    super(seed);
    this.data = {};
  }

  getData() {
    return this.data;
  }

  setData(data: MapData) {
    this.data = data;
  }

  protected getPointData(x: number, z: number): number | undefined {
    const key = Abstract2DMap.computeKey(x, z);
    return this.data[key];
  }

  protected setPointData(x: number, z: number, val: number) {
    const key = Abstract2DMap.computeKey(x, z);
    this.data[key] = val;
    return val;
  }

  protected static computeKey(x: number, z: number) {
    return `${Math.floor(x)},${Math.floor(z)}`;
  }
}
