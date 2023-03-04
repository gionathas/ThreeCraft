import alea from "alea";
import { Chunk, ChunkID } from "../../terrain/chunk";
import Tree from "../../terrain/Tree";
import World from "../../terrain/World";
import DensityMap from "../DensityMap";
import TerrainShapeMap from "../TerrainShapeMap";
import TreeMap, { TreeMapType, TreeMapValue } from "./TreeMap";
import TreeMapValueEncoder from "./TreeMapValueEncoder";

const treesDensityFactor = 0.98;

/**
 * //WARN This class store the data of all the chunks loaded,
 *  without garbage collecting the data associated to unloaded chunks
 *
 * //NOTE extract a TreeGenerator class ?
 */
export default class GlobalTreeMap extends TreeMap {
  private loadedRegions: Map<string, Array<TreeMapType>>;
  private densityMap: DensityMap;

  constructor(terrainShapeMap: TerrainShapeMap, densityMap: DensityMap) {
    super(terrainShapeMap);
    this.densityMap = densityMap;
    this.loadedRegions = new Map();
  }

  /**
   * //WARN This method create a new Array each time it is called
   */
  loadChunkTreeMap(chunkId: ChunkID): Uint16Array {
    const { x: originX, z: originZ } = World.getChunkOriginPosition(chunkId);

    const chunkRegionKey = TreeMap.computeKey(originX, originZ);

    if (this.loadedRegions.has(chunkRegionKey)) {
      const chunkTreeMapData = this.loadedRegions.get(chunkRegionKey)!;
      return Uint16Array.from(chunkTreeMapData);
    }

    const startX = originX - Tree.RADIUS;
    const startZ = originZ - Tree.RADIUS;

    const endX = originX + Chunk.WIDTH + Tree.RADIUS;
    const endZ = originZ + Chunk.WIDTH + Tree.RADIUS;

    const chunkTreeMapData = [];

    // generate the tree map data for the chunk
    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        this.generateTreeMapValueAt(x, z);
      }
    }

    // load the tree map data into a buffer
    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        const value = this.getTreeMapValueAt(x, z)!;
        chunkTreeMapData.push(value);
      }
    }

    this.loadedRegions.set(chunkRegionKey, chunkTreeMapData);
    return Uint16Array.from(chunkTreeMapData);
  }

  unloadChunkTreeMap(chunkId: ChunkID) {
    const { x: originX, z: originZ } = World.getChunkOriginPosition(chunkId);

    const chunkRegionKey = TreeMap.computeKey(originX, originZ);
    this.loadedRegions.delete(chunkRegionKey);
  }

  private generateTreeMapValueAt(x: number, z: number) {
    const prevValue = this.getTreeMapValueAt(x, z);

    // position already processed
    if (prevValue != null) {
      return prevValue;
    }

    const trunkSurfaceY = this.terrainShapeMap.getSurfaceHeightAt(x, z);
    const isAboveWater = trunkSurfaceY < World.SEA_LEVEL;
    const isAboveAir = this.densityMap.getDensityAt(x, trunkSurfaceY, z) < 0;

    // no chance to spawn a trunk here
    if (!this.hasTrunkChanceToSpawnAt(x, z) || isAboveWater || isAboveAir) {
      return this.setTreeMapEmptyAt(x, z);
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
          this.getTreeMapTypeAt(nearbyX, nearbyZ) === TreeMapType.TRUNK;

        // found a nearby trunk too close, can't spawn
        if (hasNearbyTrunk) {
          return this.setTreeMapEmptyAt(x, z);
        }
      }
    }

    // mark the current block as a tree trunk
    const trunkData = this.setTreeTrunkAt(x, z, trunkSurfaceY);

    // mark all the nearby blocks as tree leafs
    for (const [nearX, nearZ] of nearbyBlocks) {
      this.setTreeLeafAt(nearX, nearZ, x, z, trunkData);
    }
  }

  //TODO to improve
  private hasTrunkChanceToSpawnAt(x: number, z: number) {
    const treeSeed = this.seed + "_" + TreeMap.computeKey(x, z);
    const prng = alea(treeSeed);
    const treeTrunkSpawnProbability = prng();

    return treeTrunkSpawnProbability > treesDensityFactor;
  }

  private setTreeTrunkAt(x: number, z: number, surfaceY: number) {
    const trunkData: TreeMapValue = {
      type: TreeMapType.TRUNK,
      trunkHeight: Tree.TRUNK_HEIGHT,
      trunkSurfaceY: surfaceY,
      trunkDistance: 0,
    };

    const trunkValue = TreeMapValueEncoder.encode(trunkData);
    this.setPointData(x, z, trunkValue);
    return trunkData;
  }

  private setTreeLeafAt(
    leafX: number,
    leafZ: number,
    trunkX: number,
    trunkZ: number,
    trunkData: TreeMapValue
  ) {
    const leafDistance = Math.sqrt(
      Math.pow(trunkX - leafX, 2) + Math.pow(trunkZ - leafZ, 2)
    );

    const leafValue = TreeMapValueEncoder.encode({
      type: TreeMapType.LEAF,
      trunkHeight: trunkData.trunkHeight,
      trunkSurfaceY: trunkData.trunkSurfaceY,
      trunkDistance: leafDistance,
    });

    this.setPointData(leafX, leafZ, leafValue);
  }

  private setTreeMapEmptyAt(x: number, z: number) {
    const emptyData = TreeMapValueEncoder.encode({
      type: TreeMapType.EMPTY,
      trunkHeight: 0,
      trunkSurfaceY: 0,
      trunkDistance: 0,
    });

    this.setPointData(x, z, emptyData);
  }
}
