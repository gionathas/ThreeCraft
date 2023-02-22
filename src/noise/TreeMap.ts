import alea from "alea";
import Abstract2DMap from "./Abstract2DMap";

const treesDensityFactor = 0.9;
const trunkHeight = 3;
const treeRadius = 2;

export default class TreeMap extends Abstract2DMap {
  constructor(seed: string) {
    super(seed);
  }

  isTreeTrunk(x: number, y: number, z: number, surfaceY: number) {
    if (y < surfaceY || Math.abs(y - surfaceY) + 1 > trunkHeight) {
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
    for (let dx = -treeRadius; dx <= treeRadius; dx++) {
      for (let dz = -treeRadius; dz <= treeRadius; dz++) {
        if (dx === 0 && dz === 0) continue; // skip the current position

        const nearbyX = x + dx;
        const nearbyZ = z + dz;
        const hasNearbyTreeSpawned = this.hasTreeTrunkSpawned(nearbyX, nearbyZ);

        // if a nearby trunk has already spawned or it will spawn, we cant place a trunk
        if (
          (hasNearbyTreeSpawned == null &&
            this.canSpawnTreeTrunk(nearbyX, nearbyZ)) ||
          hasNearbyTreeSpawned
        ) {
          this.setTreeTrunkSpawn(x, z, false);
          return false;
        }
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
