import { ChunkID } from "../terrain/chunk";
import Tree from "../terrain/Tree";
import World from "../terrain/World";
import { MapData } from "./AbstractMap";
import MapManager from "./MapManager";
import {
  ContinentalMap,
  DensityMap,
  ErosionMap,
  HeightMap,
  PVMap,
  TerrainMap,
} from "./terrain";
import { TreeMap } from "./tree";

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

  getTreeMapFromBuffer(chunkId: ChunkID, buffer: Uint16Array): TreeMap {
    const { x: originX, z: originZ } = World.getChunkOriginPosition(chunkId);

    const treeMap = new TreeMap(this.seed);
    const treeMapData: MapData = new Map();

    const startX = originX - Tree.RADIUS;
    const startZ = originZ - Tree.RADIUS;

    for (let i = 0; i < buffer.length; i++) {
      const x = Math.floor(i / TreeMap.MAP_SIZE) + startX;
      const z = (i % TreeMap.MAP_SIZE) + startZ;

      const key = TreeMap.computeKey(x, z);
      treeMapData.set(key, buffer[i]);
    }

    treeMap.setMapData(treeMapData);
    return treeMap;
  }
}
