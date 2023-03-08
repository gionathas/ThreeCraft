import ContinentalMap from "./ContinentalMap";
import DensityMap from "./DensityMap";
import ErosionMap from "./ErosionMap";
import HeightMap from "./HeightMap";
import MapManager from "./MapManager";
import PVMap from "./PVMap";
import TerrainMap from "./TerrainMap";

export default class WorkerMapManager extends MapManager {
  constructor(seed: string) {
    super(seed);
  }

  getTerrainMap() {
    const { seed } = this;

    const continentalMap = new ContinentalMap(
      MapManager.getContinentalMapSeed(seed)
    );

    const erosionMap = new ErosionMap(MapManager.getErosionMapSeed(seed));
    const pvMap = new PVMap(MapManager.getPvMapSeed(seed));

    const heightMap = new HeightMap(
      MapManager.getHeightMapSeed(seed),
      continentalMap,
      erosionMap,
      pvMap
    );

    const densityMap = new DensityMap(
      MapManager.getDensityMapSeed(seed),
      erosionMap,
      pvMap
    );

    const terrainMap = new TerrainMap(
      seed,
      continentalMap,
      erosionMap,
      pvMap,
      heightMap,
      densityMap
    );

    return terrainMap;
  }
}
