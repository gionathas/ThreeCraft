import { Map2D } from "./AbstractMap";

export default class Global2DMap<T extends Map2D> implements Map2D {
  private regionSize: number;
  private regions: Map<string, T>;

  private createNewMap: () => T;

  constructor(regionSize: number, createMapFn: () => T) {
    this.regionSize = regionSize;
    this.regions = new Map();
    this.createNewMap = createMapFn;
  }

  unloadRegionAt(x: number, z: number) {
    const regionKey = this.getRegionKey(x, z);
    this.regions.delete(regionKey);
  }

  getValueAt(x: number, z: number) {
    const regionKey = this.getRegionKey(x, z);
    const regionMap = this.regions.get(regionKey);

    if (regionMap) {
      return regionMap.getValueAt(x, z);
    }

    const map = this.createNewMap();
    const val = map.getValueAt(x, z);
    this.regions.set(regionKey, map);
    return val;
  }

  private getRegionKey(x: number, z: number) {
    const { regionSize: size } = this;
    const regionX = Math.floor(x / size);
    const regionZ = Math.floor(z / size);

    return `${regionX}_${regionZ}`;
  }

  _totalRegionsCount() {
    return this.regions.size;
  }
}
