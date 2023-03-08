import { ChunkID } from "../../terrain/chunk";
import Tree from "../../terrain/Tree";
import World from "../../terrain/World";
import { MapData } from "../AbstractMap";
import TerrainMap from "../TerrainMap";
import TreeMap from "./TreeMap";

export default class TreeMapBuilder {
  static generateChunkTreeMapFromBuffer(
    chunkId: ChunkID,
    buffer: Uint16Array,
    terrainShapeMap: TerrainMap
  ): TreeMap {
    const { x: originX, z: originZ } = World.getChunkOriginPosition(chunkId);

    const treeMap = new TreeMap(terrainShapeMap);
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
