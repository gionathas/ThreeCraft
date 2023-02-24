import alea from "alea";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../config/constants";
import { ChunkID } from "../terrain/Chunk";
import Tree from "../terrain/Tree";
import ChunkUtils from "../utils/ChunkUtils";
import { MapData } from "./Abstract2DMap";
import HeightMap from "./HeightMap";
import TreeMap from "./TreeMap";

const treesDensityFactor = 0.98;

// WARN since it's used by the main thread the data grow undefinetely
export default class SharedTreeMap extends TreeMap {
  private loadedRegions: Map<string, Array<number>>;

  constructor(seed: string, heightMap: HeightMap) {
    super(seed, heightMap);
    this.loadedRegions = new Map();
  }

  loadChunkTreeMap(chunkId: ChunkID): Uint8Array {
    const { x: originX, z: originZ } =
      ChunkUtils.computeChunkWorldOriginPosition(
        chunkId,
        CHUNK_WIDTH,
        CHUNK_HEIGHT
      );

    const regionKey = TreeMap.computeKey(originX, originZ);

    if (this.loadedRegions.has(regionKey)) {
      const regionData = this.loadedRegions.get(regionKey)!;
      return Uint8Array.from(regionData);
    }

    const startX = originX - Tree.RADIUS;
    const startZ = originZ - Tree.RADIUS;
    const endX = originX + CHUNK_WIDTH + Tree.RADIUS;
    const endZ = originZ + CHUNK_WIDTH + Tree.RADIUS;

    const regionData = [];

    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        const isTreeSpawned = this.computeTreeSpawn(x, z);
        regionData.push(isTreeSpawned);
      }
    }

    this.loadedRegions.set(regionKey, regionData);

    return Uint8Array.from(regionData);
  }

  static convertChunkBufferDataToMapData(
    chunkId: ChunkID,
    buffer: Uint8Array
  ): MapData {
    const mapSize = CHUNK_WIDTH + Tree.RADIUS * 2;

    const { x: originX, z: originZ } =
      ChunkUtils.computeChunkWorldOriginPosition(
        chunkId,
        CHUNK_WIDTH,
        CHUNK_HEIGHT
      );

    const startX = originX - Tree.RADIUS;
    const startZ = originZ - Tree.RADIUS;

    const treeMapData: MapData = {};

    for (let i = 0; i < buffer.length; i++) {
      const x = Math.floor(i / mapSize) + startX;
      const z = (i % mapSize) + startZ;

      const key = TreeMap.computeKey(x, z);
      treeMapData[key] = buffer[i];
    }

    return treeMapData;
  }

  unloadChunkTreeMap(chunkId: ChunkID) {
    const { x: originX, z: originZ } =
      ChunkUtils.computeChunkWorldOriginPosition(
        chunkId,
        CHUNK_WIDTH,
        CHUNK_HEIGHT
      );

    const regionKey = TreeMap.computeKey(originX, originZ);
    this.loadedRegions.delete(regionKey);
  }

  private computeTreeSpawn(x: number, z: number) {
    const hasTreeSpawned = this.getPointData(x, z);

    // position already processed
    if (hasTreeSpawned != null) {
      return hasTreeSpawned;
    }

    // no chance to spawn here
    if (!this.hasChanceToSpawn(x, z)) {
      return this.setTreeSpawn(x, z, false);
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

        const hasNearbyTree = this.hasTreeSpawned(nearbyX, nearbyZ);

        // found a nearby tree too close, can't spawn
        if (hasNearbyTree) {
          return this.setTreeSpawn(x, z, false);
        }
      }
    }

    // mark all the neighbours blocks as not suitable for tree spawning
    for (const [nearX, nearZ] of visitedBlocks) {
      this.setTreeSpawn(nearX, nearZ, false);
    }

    // no nearby trees, we can spawn the tree
    return this.setTreeSpawn(x, z, true);
  }

  private hasChanceToSpawn(x: number, z: number) {
    const treeSeed = this.seed + "_" + TreeMap.computeKey(x, z);
    const prng = alea(treeSeed);
    const treeTrunkSpawnProbability = prng();

    return treeTrunkSpawnProbability > treesDensityFactor;
  }

  private setTreeSpawn(x: number, z: number, spawn: boolean) {
    return this.setPointData(x, z, spawn ? 1 : 0);
  }
}
