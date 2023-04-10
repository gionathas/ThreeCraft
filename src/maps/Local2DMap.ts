import AbstractMap, { MapData } from "./AbstractMap";

export default abstract class Local2DMap extends AbstractMap {
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

  protected getPointData(x: number, z: number): number | undefined {
    const key = Local2DMap.computeKey(x, z);
    return this.data.get(key);
  }

  protected setPointData(x: number, z: number, val: number) {
    const key = Local2DMap.computeKey(x, z);

    this.data.set(key, val);
    return val;
  }

  static computeKey(x: number, z: number) {
    return `${Math.floor(x)}_${Math.floor(z)}`;
  }
}
