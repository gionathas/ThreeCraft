import alea from "alea";
import { lerp } from "three/src/math/MathUtils";
import { Chunk, ChunkID } from "../../terrain/chunk";
import Tree from "../../terrain/Tree";
import World from "../../terrain/World";
import Global2DMap from "../Global2DMap";
import { ContinentalMap, ErosionMap, PVMap, TerrainMap } from "../terrain";
import TreeMap, { TreeMapType, TreeMapValue } from "./TreeMap";
import TreeMapValueEncoder from "./TreeMapValueEncoder";

/**
 * This class is responsible for generating on demand the tree map data for a given chunk.
 */
export default class GlobalTreeMap extends Global2DMap<TreeMap> {
  private readonly LOW_DENSITY = 0.002;
  private readonly MID_DENSITY = 0.02;
  private readonly HIGH_DENSITY = 0.04;

  private seed: string;
  private terrainMap: TerrainMap;

  private chunksTreeMapDataCache: Map<string, Array<TreeMapType>>;

  constructor(seed: string, terrainMap: TerrainMap) {
    super(TreeMap.MAP_SIZE, () => new TreeMap(seed));
    this.seed = seed;
    this.terrainMap = terrainMap;
    this.chunksTreeMapDataCache = new Map();
  }

  /**
   * //WARN This method create a new Array each time it is called
   */
  loadChunkTreeMapData(chunkId: ChunkID): Uint16Array {
    const { x: originX, z: originZ } = World.getChunkOriginPosition(chunkId);

    const chunkCacheKey = this.computeChunkCacheKey(originX, originZ);

    if (this.chunksTreeMapDataCache.has(chunkCacheKey)) {
      const chunkTreeMapData = this.chunksTreeMapDataCache.get(chunkCacheKey)!;
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
        const value = this.getValueAt(x, z)!;
        chunkTreeMapData.push(value);
      }
    }

    this.chunksTreeMapDataCache.set(chunkCacheKey, chunkTreeMapData);
    return Uint16Array.from(chunkTreeMapData);
  }

  unloadChunkTreeMapData(chunkId: ChunkID) {
    const { x: originX, z: originZ } = World.getChunkOriginPosition(chunkId);

    const chunkCacheKey = this.computeChunkCacheKey(originX, originZ);
    this.chunksTreeMapDataCache.delete(chunkCacheKey);
  }

  private generateTreeMapValueAt(x: number, z: number) {
    const prevValue = this.getValueAt(x, z);

    // already a tree or leaf here
    if (!this.isEmptyValue(prevValue)) {
      return prevValue;
    }

    const trunkSurfaceY = this.terrainMap.getSurfaceHeightAt(x, z);
    const isFloating = this.terrainMap.getDensityAt(x, trunkSurfaceY, z) < 0;
    const isAboveWater = trunkSurfaceY < World.SEA_LEVEL;

    // no chance to spawn a trunk here
    if (!this.hasTrunkChanceToSpawnAt(x, z) || isAboveWater || isFloating) {
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

    return TreeMapType.TRUNK;
  }

  private hasTrunkChanceToSpawnAt(x: number, z: number) {
    const treeSeed = TreeMap.getTreeSeedAt(this.seed, x, z);

    const prng = alea(treeSeed);
    const treeTrunkSpawnProbability = prng();
    const treeDensityFactor = this.getTreeDensityFactorAt(x, z);

    return treeTrunkSpawnProbability < treeDensityFactor;
  }

  private getTreeDensityFactorAt(x: number, z: number) {
    const erosion = this.terrainMap.getErosionAt(x, z);
    const pv = this.terrainMap.getPVAt(x, z);
    const pvType = PVMap.getType(pv);

    const erosionType = ErosionMap.getType(erosion);

    const noTreesDensity = 0;
    const maxTreeDensity = this.getMaxTreeDensityAt(x, z);

    // no trees on flat terrains
    if (erosionType === "Flat" || pvType === "Peak") {
      return noTreesDensity;
    }

    if (pvType === "Plateau") {
      return maxTreeDensity;
    }

    if (pv < PVMap.NoiseRange.Plateau.min) {
      const min = PVMap.NoiseRange.Valley.min;
      const max = PVMap.NoiseRange.Plateau.min;

      const t = (pv - min) / (max - min);
      return lerp(noTreesDensity, maxTreeDensity, t);
    } else {
      const min = PVMap.NoiseRange.Plateau.max;
      const max = PVMap.NoiseRange.High.max;

      const invT = (max - pv) / (max - min);
      return lerp(noTreesDensity, maxTreeDensity, invT);
    }
  }

  private getMaxTreeDensityAt(x: number, z: number) {
    const { LOW_DENSITY, MID_DENSITY, HIGH_DENSITY } = this;
    const continentalness = this.terrainMap.getContinentalnessAt(x, z);
    const continentType = ContinentalMap.getType(continentalness);

    if (continentType === "Inland") {
      return HIGH_DENSITY;
    }

    if (continentType === "Near_Inland" || continentType === "Far_Inland") {
      return MID_DENSITY;
    }

    if (continentType === "Coast") {
      return LOW_DENSITY;
    }

    // no trees on ocean
    return 0;
  }

  private getTreeMapTypeAt(x: number, z: number): TreeMapType | null {
    const value = this.getValueAt(x, z);

    if (value != null) {
      return TreeMapValueEncoder.getType(value);
    }

    return null;
  }

  private isEmptyValue(value: number) {
    return TreeMapValueEncoder.getType(value) === TreeMapType.EMPTY;
  }

  private setTreeTrunkAt(x: number, z: number, surfaceY: number) {
    const trunkData: TreeMapValue = {
      type: TreeMapType.TRUNK,
      trunkHeight: Tree.TRUNK_HEIGHT,
      trunkSurfaceY: surfaceY,
      trunkDistance: 0,
    };

    const trunkValue = TreeMapValueEncoder.encode(trunkData);
    this.setValueAt(x, z, trunkValue);

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

    return this.setValueAt(leafX, leafZ, leafValue);
  }

  private setTreeMapEmptyAt(x: number, z: number) {
    const emptyData = TreeMapValueEncoder.encode({
      type: TreeMapType.EMPTY,
      trunkHeight: 0,
      trunkSurfaceY: 0,
      trunkDistance: 0,
    });

    return this.setValueAt(x, z, emptyData);
  }

  private computeChunkCacheKey(x: number, z: number) {
    return `${x}_${z}`;
  }
}
