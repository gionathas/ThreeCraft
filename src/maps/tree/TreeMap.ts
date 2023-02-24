import * as THREE from "three";
import { CHUNK_WIDTH } from "../../config/constants";
import Tree from "../../terrain/Tree";
import { isInRange } from "../../utils/helpers";
import Abstract2DMap from "../Abstract2DMap";
import HeightMap from "../HeightMap";

export default class TreeMap extends Abstract2DMap {
  /**
   * The size of the tree map is the size of the chunk + the radius of the tree
   * because a tree can spawn on the edge of the chunk
   */
  static readonly MAP_SIZE = CHUNK_WIDTH + Tree.RADIUS * 2;

  private heightMap: HeightMap;

  constructor(seed: string, heightMap: HeightMap) {
    super(seed);
    this.heightMap = heightMap;
  }

  shouldSpawnTreeLeavesAt(x: number, y: number, z: number, surfaceY: number) {
    if (y < surfaceY) {
      return false;
    }

    const leaveTreeTrunk = this.findTreeTrunkForLeaveBlockAt(x, y, z);

    if (leaveTreeTrunk) {
      const [trunkX, trunkZ] = leaveTreeTrunk;
      const trunkStartY = this.heightMap.getSurfaceHeightAt(trunkX, trunkZ);
      const trunkEndY = trunkStartY + Tree.TRUNK_HEIGHT;

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
  private findTreeTrunkForLeaveBlockAt(x: number, y: number, z: number) {
    const treeRadius = Tree.RADIUS;

    for (let dx = -treeRadius; dx <= treeRadius; dx++) {
      for (let dz = -treeRadius; dz <= treeRadius; dz++) {
        const nearbyX = x + dx;
        const nearbyZ = z + dz;

        const isTreeTrunkSpawned = this.hasTreeSpawnedAt(nearbyX, nearbyZ);

        if (isTreeTrunkSpawned != null && isTreeTrunkSpawned) {
          return [nearbyX, nearbyZ];
        }
      }
    }

    return null;
  }

  shouldSpawnTreeTrunkAt(x: number, y: number, z: number, surfaceY: number) {
    const distFromSurface = Math.abs(y - surfaceY) + 1;

    if (y < surfaceY || distFromSurface > Tree.TRUNK_HEIGHT) {
      return false;
    }

    return this.hasTreeSpawnedAt(x, z) ? true : false;
  }

  protected hasTreeSpawnedAt(x: number, z: number) {
    const treeTrunkSpawn = this.getPointData(x, z);
    return treeTrunkSpawn != null ? Boolean(treeTrunkSpawn) : null;
  }
}
