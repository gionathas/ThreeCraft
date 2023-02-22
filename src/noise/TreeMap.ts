import alea from "alea";
import Abstract2DMap from "./Abstract2DMap";

// higher density less tree, lower density more trees
const densityFactor = 0.7;

export default class TreeMap extends Abstract2DMap {
  constructor(seed: string) {
    super(seed);
  }

  hasTree(x: number, z: number) {
    const cachedSpawnTree = this.getCacheValue(x, z);

    if (cachedSpawnTree != null) {
      return Boolean(cachedSpawnTree);
    }

    const canSpawn = this.canSpawnTree(x, z);

    if (!canSpawn) {
      this.setCacheValue(x, z, 0);
      return false;
    }

    // check if there are any trees within a radius of 2 blocks
    const radius = 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (dx === 0 && dz === 0) continue; // skip the current position

        const nearbyX = x + dx;
        const nearbyZ = z + dz;

        const cachedNearbyTree = this.getCacheValue(nearbyX, nearbyZ);

        if (cachedNearbyTree != null) {
          const hasNearbyTree = Boolean(cachedNearbyTree);

          // found a too close tree, we can't spawn the tree
          if (hasNearbyTree) {
            this.setCacheValue(x, z, 0);
            return false;
          }
        } else {
          const hasNearbyTree = this.canSpawnTree(nearbyX, nearbyZ);

          // found a too close tree, we can't spawn the tree
          if (hasNearbyTree) {
            this.setCacheValue(x, z, 0);
            return false;
          }
        }
      }
    }

    // we can spawn the tree
    this.setCacheValue(x, z, 1);
    return true;
  }

  private canSpawnTree(x: number, z: number) {
    const treeSeed = this.seed + "_" + this.getCacheKey(x, z);
    const prng = alea(treeSeed);
    const treeSpawnProbability = prng();

    return treeSpawnProbability > densityFactor;
  }

  //   protected getPRNGSeed(x: number, z: number) {
  //     return this.seed + "_" + this.getCacheKey(x, z);
  //   }
}
