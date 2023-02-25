import alea from "alea";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../../config/constants";
import { ChunkID } from "../../terrain/Chunk";
import Tree from "../../terrain/Tree";
import ChunkUtils from "../../utils/ChunkUtils";
import HeightMap from "../HeightMap";
import TreeMap, { TreeMapValue } from "./TreeMap";

const treesDensityFactor = 0.98;

/**
 * //WARN This class store the data of all the chunks loaded,
 *  without garbage collecting the data associated to unloaded chunks
 *
 * //NOTE do we really need to extends TreeMap ?
 *
 * //NOTE implement a TreeGenerator class ?
 */
export default class GlobalTreeMap extends TreeMap {
  private loadedMaps: Map<string, Array<TreeMapValue>>;

  constructor(seed: string, heightMap: HeightMap) {
    super(seed, heightMap);
    this.loadedMaps = new Map();
  }

  /**
   * //WARN This method create a new Uint8Array each time it is called
   */
  loadChunkTreeMap(chunkId: ChunkID): Uint8Array {
    const { x: originX, z: originZ } =
      ChunkUtils.computeChunkWorldOriginPosition(
        chunkId,
        CHUNK_WIDTH,
        CHUNK_HEIGHT
      );

    const chunkRegionKey = TreeMap.computeKey(originX, originZ);

    if (this.loadedMaps.has(chunkRegionKey)) {
      const chunkTreeMapData = this.loadedMaps.get(chunkRegionKey)!;
      return Uint8Array.from(chunkTreeMapData);
    }

    const startX = originX - Tree.RADIUS;
    const startZ = originZ - Tree.RADIUS;

    const endX = originX + CHUNK_WIDTH + Tree.RADIUS;
    const endZ = originZ + CHUNK_WIDTH + Tree.RADIUS;

    const chunkTreeMapData = [];

    // generate the tree map data for the chunk
    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        this.generateTreeMapValueAt(x, z);
      }
    }

    // load the tree map inside a buffer
    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        const value = this.getTreeMapValueAt(x, z)!;
        chunkTreeMapData.push(value);
      }
    }

    this.loadedMaps.set(chunkRegionKey, chunkTreeMapData);
    return Uint8Array.from(chunkTreeMapData);
  }

  unloadChunkTreeMap(chunkId: ChunkID) {
    const { x: originX, z: originZ } =
      ChunkUtils.computeChunkWorldOriginPosition(
        chunkId,
        CHUNK_WIDTH,
        CHUNK_HEIGHT
      );

    const chunkRegionKey = TreeMap.computeKey(originX, originZ);
    this.loadedMaps.delete(chunkRegionKey);
  }

  private generateTreeMapValueAt(x: number, z: number): TreeMapValue {
    const prevValue = this.getTreeMapValueAt(x, z);

    // position already processed
    if (prevValue != null) {
      return prevValue;
    }

    // no chance to spawn a trunk here
    if (!this.hasTrunkChanceToSpawnAt(x, z)) {
      return this.setTreeMapValueAt(x, z, TreeMapValue.EMPTY);
    }

    const nearbyBlocks: [number, number][] = [];

    // A tree can potentially spawn here BUT we need to check
    // if there are any trunk already placed within a certain radius
    for (let dx = -Tree.RADIUS; dx <= Tree.RADIUS; dx++) {
      for (let dz = -Tree.RADIUS; dz <= Tree.RADIUS; dz++) {
        if (dx === 0 && dz === 0) continue; // skip the current position

        const nearbyX = x + dx;
        const nearbyZ = z + dz;
        nearbyBlocks.push([nearbyX, nearbyZ]);

        const hasNearbyTrunk =
          this.getTreeMapValueAt(nearbyX, nearbyZ) === TreeMapValue.TRUNK;

        // found a nearby trunk too close, can't spawn
        if (hasNearbyTrunk) {
          return this.setTreeMapValueAt(x, z, TreeMapValue.EMPTY);
        }
      }
    }

    // mark all the nearby blocks as tree leafs
    for (const [nearX, nearZ] of nearbyBlocks) {
      this.setTreeMapValueAt(nearX, nearZ, TreeMapValue.LEAF);
    }

    // and mark the current block as a tree trunk
    return this.setTreeMapValueAt(x, z, TreeMapValue.TRUNK);
  }

  //TODO to improve
  private hasTrunkChanceToSpawnAt(x: number, z: number) {
    const treeSeed = this.seed + "_" + TreeMap.computeKey(x, z);
    const prng = alea(treeSeed);
    const treeTrunkSpawnProbability = prng();

    return treeTrunkSpawnProbability > treesDensityFactor;
  }

  private setTreeMapValueAt(x: number, z: number, value: TreeMapValue) {
    return this.setPointData(x, z, value);
  }
}
