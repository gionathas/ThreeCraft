import AbstractMap, { MapData } from "./AbstractMap";

export default abstract class Local3DMap extends AbstractMap {
  protected data: MapData;

  constructor(seed: string) {
    super(seed);
    this.data = new Map();
  }

  getMapData() {
    return this.data;
  }

  setMapData(data: MapData) {
    this.data = data;
  }

  protected getPointData(x: number, y: number, z: number): number | undefined {
    const key = Local3DMap.computeKey(x, y, z);
    return this.data.get(key);
  }

  protected setPointData(x: number, y: number, z: number, val: number) {
    const key = Local3DMap.computeKey(x, y, z);
    this.data.set(key, val);
    return val;
  }

  static computeKey(x: number, y: number, z: number) {
    return `${Math.floor(x)}_${Math.floor(y)}_${Math.floor(z)}`;
  }
}
