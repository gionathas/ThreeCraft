import alea from "alea";
import { isInRange } from "../utils/helpers";
import Abstract2DMap from "./Abstract2DMap";
import HeightMap from "./HeightMap";

const treesDensityFactor = 0.7;
const trunkHeight = 4;
const treeHRadius = 2;

const treeLeavesStartY = 3;
const treeLeavesEndY = 5;

/**
 * //TODO optimization: use 2 seprate tree trunk spawn probabilities,
 * one for the processed trunk and another one for the nearby trunks
 */
export default class TreeMap extends Abstract2DMap {
  private heightMap: HeightMap;

  constructor(seed: string, heightMap: HeightMap) {
    super(seed);
    this.heightMap = heightMap;
  }

  isTreeLeaves(x: number, y: number, z: number, surfaceY: number) {
    const distFromSurface = Math.abs(y - surfaceY);

    if (y < surfaceY) {
      return false;
    }

    const nearestTrunk = this.findNearestTrunk(x, y, z);

    if (nearestTrunk) {
      const [trunkX, trunkZ] = nearestTrunk;
      const trunkStartY = this.heightMap.getSurfaceHeight(trunkX, trunkZ);
      const trunkEndY = trunkStartY + trunkHeight;

      return isInRange(y, trunkEndY - 1, trunkEndY + 1);
    }

    return false;
  }

  private findNearestTrunk(x: number, y: number, z: number) {
    for (let dx = -treeHRadius; dx <= treeHRadius; dx++) {
      for (let dz = -treeHRadius; dz <= treeHRadius; dz++) {
        const nearbyX = x + dx;
        const nearbyZ = z + dz;

        const isTreeTrunkSpawned = this.hasTreeTrunkSpawned(nearbyX, nearbyZ);

        if (isTreeTrunkSpawned != null && isTreeTrunkSpawned) {
          return [nearbyX, nearbyZ];
        }
      }
    }

    return null;
  }

  isTreeTrunk(x: number, y: number, z: number, surfaceY: number) {
    const distFromSurface = Math.abs(y - surfaceY) + 1;

    if (y < surfaceY || distFromSurface > trunkHeight) {
      return false;
    }

    const isTreeTrunkSpawned = this.hasTreeTrunkSpawned(x, z);

    if (isTreeTrunkSpawned != null) {
      return isTreeTrunkSpawned;
    }

    // if it's not already spawn, can the trunk spawn ?
    const canTrunkSpawn = this.canSpawnTreeTrunk(x, z);

    if (!canTrunkSpawn) {
      this.setTreeTrunkSpawn(x, z, false);
      return false;
    }

    // The trunk can potentially spawn in this position BUT we need to check
    // if there are any trees within a certain radius
    for (let dx = -treeHRadius; dx <= treeHRadius; dx++) {
      for (let dz = -treeHRadius; dz <= treeHRadius; dz++) {
        if (dx === 0 && dz === 0) continue; // skip the current position

        const nearbyX = x + dx;
        const nearbyZ = z + dz;
        const hasNearbyTree = this.hasTreeTrunkSpawned(nearbyX, nearbyZ);

        // if a nearby trunk has already spawned, we cant place a trunk
        if (hasNearbyTree) {
          this.setTreeTrunkSpawn(x, z, false);
          return false;
        }
        // if (
        //   (hasNearbyTreeSpawned == null &&
        //     this.canSpawnTreeTrunk(nearbyX, nearbyZ)) ||
        //   hasNearbyTreeSpawned
        // ) {
        //   this.setTreeTrunkSpawn(x, z, false);
        //   return false;
        // }
      }
    }

    // we can spawn the tree
    this.setTreeTrunkSpawn(x, z, true);
    return true;
  }

  private hasTreeTrunkSpawned(x: number, z: number) {
    const cachedTreeTrunkSpawn = this.getCacheValue(x, z);
    return cachedTreeTrunkSpawn != null ? Boolean(cachedTreeTrunkSpawn) : null;
  }

  private setTreeTrunkSpawn(x: number, z: number, spawn: boolean) {
    return this.setCacheValue(x, z, spawn ? 1 : 0);
  }

  private canSpawnTreeTrunk(x: number, z: number) {
    const treeSeed = this.seed + "_" + this.getCacheKey(x, z);
    const prng = alea(treeSeed);
    const treeTrunkSpawnProbability = prng();

    return treeTrunkSpawnProbability > treesDensityFactor;
  }
}
