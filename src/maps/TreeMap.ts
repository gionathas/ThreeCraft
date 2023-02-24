import * as THREE from "three";
import { isInRange } from "../utils/helpers";
import Abstract2DMap from "./Abstract2DMap";
import HeightMap from "./HeightMap";

const trunkHeight = 4;
const treeHRadius = 2;

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

      const isTreeLeaves = isInRange(y, trunkEndY - 1, trunkEndY + 1);

      if (isTreeLeaves) {
        const trunkPosition = new THREE.Vector3(trunkX, trunkEndY, trunkZ);
        const leavePosition = new THREE.Vector3(x, y, z);

        const dist = leavePosition.distanceToSquared(trunkPosition);

        return true;

        // return dist > 1 ? Math.random() > 0.4 : true;
      }
    }

    return false;
  }

  //TODO to improve (we need to take into account the y level between the tree and the block)
  private findNearestTrunk(x: number, y: number, z: number) {
    for (let dx = -treeHRadius; dx <= treeHRadius; dx++) {
      for (let dz = -treeHRadius; dz <= treeHRadius; dz++) {
        const nearbyX = x + dx;
        const nearbyZ = z + dz;

        const isTreeTrunkSpawned = this.hasTreeSpawned(nearbyX, nearbyZ);

        if (isTreeTrunkSpawned != null && isTreeTrunkSpawned) {
          return [nearbyX, nearbyZ];
        }
      }
    }

    return null;
  }

  isTree2(x: number, y: number, z: number, surfaceY: number) {
    const distFromSurface = Math.abs(y - surfaceY) + 1;

    if (y < surfaceY || distFromSurface > trunkHeight) {
      return false;
    }

    // FIXME
    return this.hasTreeSpawned(x, z) ?? false;
  }

  protected hasTreeSpawned(x: number, z: number) {
    const cachedTreeTrunkSpawn = this.getPointData(x, z);
    return cachedTreeTrunkSpawn != null ? Boolean(cachedTreeTrunkSpawn) : null;
  }
}
