import alea from "alea";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../../config/constants";
import { ChunkID } from "../../terrain/Chunk";
import Tree from "../../terrain/Tree";
import ChunkUtils from "../../utils/ChunkUtils";
import HeightMap from "../HeightMap";
import TreeMap from "./TreeMap";

const treesDensityFactor = 0.98;

/**
 * //WARN This class store the data of all the chunks loaded,
 *  without garbage collecting the data associated to unloaded chunks
 *
 * //TODO do we really need to extends TreeMap ?
 */
export default class GlobalTreeMap extends TreeMap {
  private loadedMaps: Map<string, Array<number>>;

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

    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        const isTreeSpawned = this.computeTreeSpawnAt(x, z);
        chunkTreeMapData.push(isTreeSpawned);
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

  private computeTreeSpawnAt(x: number, z: number) {
    const hasTreeSpawned = this.getPointData(x, z);

    // position already processed
    if (hasTreeSpawned != null) {
      return hasTreeSpawned;
    }

    // no chance to spawn here
    if (!this.hasTreeChanceToSpawnAt(x, z)) {
      return this.setTreeSpawnAt(x, z, false);
    }

    const visitedBlocks: [number, number][] = [];

    // A tree can potentially spawn BUT we need to check
    // if there are already trees within a certain radius
    for (let dx = -Tree.RADIUS; dx <= Tree.RADIUS; dx++) {
      for (let dz = -Tree.RADIUS; dz <= Tree.RADIUS; dz++) {
        if (dx === 0 && dz === 0) continue; // skip the current position

        const nearbyX = x + dx;
        const nearbyZ = z + dz;
        visitedBlocks.push([nearbyX, nearbyZ]);

        const hasNearbyTree = this.hasTreeSpawnedAt(nearbyX, nearbyZ);

        // found a nearby tree too close, can't spawn
        if (hasNearbyTree) {
          return this.setTreeSpawnAt(x, z, false);
        }
      }
    }

    // mark all the neighbours blocks as not suitable for tree spawning
    for (const [nearX, nearZ] of visitedBlocks) {
      this.setTreeSpawnAt(nearX, nearZ, false);
    }

    // no nearby trees, we can spawn the tree
    return this.setTreeSpawnAt(x, z, true);
  }

  private hasTreeChanceToSpawnAt(x: number, z: number) {
    const treeSeed = this.seed + "_" + TreeMap.computeKey(x, z);
    const prng = alea(treeSeed);
    const treeTrunkSpawnProbability = prng();

    return treeTrunkSpawnProbability > treesDensityFactor;
  }

  private setTreeSpawnAt(x: number, z: number, spawn: boolean) {
    return this.setPointData(x, z, spawn ? 1 : 0);
  }
}
