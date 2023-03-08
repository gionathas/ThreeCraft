import { Map3D } from "./AbstractMap";

export default class Global3DMap<T extends Map3D> implements Map3D {
  private regionSize: number;
  private regionHeight: number;

  private regions: Map<string, T>;

  private createNewMap: () => T;

  constructor(regionSize: number, regionHeight: number, createMapFn: () => T) {
    this.regionSize = regionSize;
    this.regionHeight = regionHeight;
    this.regions = new Map();
    this.createNewMap = createMapFn;
  }

  unloadRegion(x: number, y: number, z: number) {
    const regionKey = this.getRegionKey(x, y, z);
    this.regions.delete(regionKey);
  }

  getValueAt(x: number, y: number, z: number) {
    const regionKey = this.getRegionKey(x, y, z);
    const regionMap = this.regions.get(regionKey);

    if (regionMap) {
      return regionMap.getValueAt(x, y, z);
    }

    const map = this.createNewMap();
    const val = map.getValueAt(x, y, z);
    this.regions.set(regionKey, map);

    return val;
  }

  private getRegionKey(x: number, y: number, z: number) {
    const { regionSize: size, regionHeight: height } = this;
    const regionX = Math.floor(x / size);
    const regionY = Math.floor(y / height);
    const regionZ = Math.floor(z / size);

    return `${regionX}_${regionY}_${regionZ}`;
  }

  _totalRegionsCount() {
    return this.regions.size;
  }
}
