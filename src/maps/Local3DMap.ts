import AbstractMap from "./AbstractMap";

export type MapData = Record<string, number>;

export default abstract class Local3DMap extends AbstractMap {
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

  protected getPointData(x: number, y: number, z: number): number | undefined {
    const key = Local3DMap.computeKey(x, y, z);
    return this.data[key];
  }

  protected setPointData(x: number, y: number, z: number, val: number) {
    const key = Local3DMap.computeKey(x, y, z);
    this.data[key] = val;
    return val;
  }

  static computeKey(x: number, y: number, z: number) {
    return `${Math.floor(x)}_${Math.floor(y)}_${Math.floor(z)}`;
  }
}
