import Chunk, { ChunkID } from "../../terrain/Chunk";
import Tree from "../../terrain/Tree";
import { MapData } from "../Abstract2DMap";
import HeightMap from "../HeightMap";
import TreeMap from "./TreeMap";

export default class TreeMapBuilder {
  static generateChunkTreeMapFromBuffer(
    chunkId: ChunkID,
    buffer: Uint16Array,
    seed: string,
    heightMap: HeightMap
  ): TreeMap {
    const { x: originX, z: originZ } =
      Chunk.computeWorldOriginPosition(chunkId);

    const treeMap = new TreeMap(seed, heightMap);
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
