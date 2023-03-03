import { ChunkID } from "../../terrain/chunk";
import Tree from "../../terrain/Tree";
import World from "../../terrain/World";
import { MapData } from "../AbstractMap";
import TerrainShapeMap from "../TerrainShapeMap";
import TreeMap from "./TreeMap";

export default class TreeMapBuilder {
  static generateChunkTreeMapFromBuffer(
    chunkId: ChunkID,
    buffer: Uint16Array,
    terrainShapeMap: TerrainShapeMap
  ): TreeMap {
    const { x: originX, z: originZ } = World.getChunkOriginPosition(chunkId);

    const treeMap = new TreeMap(terrainShapeMap);
    const treeMapData: MapData = {};

    const startX = originX - Tree.RADIUS;
    const startZ = originZ - Tree.RADIUS;

    for (let i = 0; i < buffer.length; i++) {
      const x = Math.floor(i / TreeMap.MAP_SIZE) + startX;
      const z = (i % TreeMap.MAP_SIZE) + startZ;

      const key = TreeMap.computeKey(x, z);
      treeMapData[key] = buffer[i];
    }

    treeMap.setData(treeMapData);
    return treeMap;
  }
}
