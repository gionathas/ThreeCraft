import { CHUNK_WIDTH } from "../../config/constants";
import Tree from "../../terrain/Tree";
import Abstract2DMap from "../Abstract2DMap";
import HeightMap from "../HeightMap";

export enum TreeMapValue {
  EMPTY = 0,
  TRUNK = 1,
  LEAF = 2,
}
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

  shouldSpawnTreeLeafAt(x: number, y: number, z: number, surfaceY: number) {
    if (
      y < surfaceY + Tree.LEAVES_START_Y ||
      y > surfaceY + Tree.LEAVES_END_Y ||
      this.getTreeMapValueAt(x, z) !== TreeMapValue.LEAF
    ) {
      return false;
    }

    return true;

    // if (tree) {
    //   return true;
    // const trunkStartY = this.heightMap.getSurfaceHeightAt(trunkX, trunkZ);
    // const trunkEndY = trunkStartY + Tree.TRUNK_HEIGHT;

    // const isTreeLeaves = isInRange(y, trunkEndY - 1, trunkEndY + 1);

    // if (isTreeLeaves) {
    //   const trunkPosition = new THREE.Vector3(trunkX, trunkEndY, trunkZ);
    //   const leavePosition = new THREE.Vector3(x, y, z);

    //   const dist = leavePosition.distanceToSquared(trunkPosition);

    //   return true;

    //   // return dist > 1 ? Math.random() > 0.4 : true;
    // }
    // }

    // return false;
  }

  /**
   * If the leaf is near a tree, it return the y level of the leave compared to the trunk end
   */
  // private findTreeTrunkForLeafAt(x: number, y: number, z: number) {
  //   const treeRadius = Tree.RADIUS;

  //   for (let dx = -treeRadius; dx <= treeRadius; dx++) {
  //     for (let dz = -treeRadius; dz <= treeRadius; dz++) {
  //       const nearbyX = x + dx;
  //       const nearbyZ = z + dz;

  //       const isTreeTrunk =
  //         this.getTreeMapValueAt(nearbyX, nearbyZ) === TreeMapValue.TRUNK;

  //       if (isTreeTrunk) {
  //         const trunkStartY = this.heightMap.getSurfaceHeightAt(
  //           nearbyX,
  //           nearbyZ
  //         );
  //         const trunkEndY = trunkStartY + Tree.TRUNK_HEIGHT;

  //         // detect in which y level the leave is
  //         const leaveYLevel = Math.abs(y - trunkEndY);

  //         // if the leave is in an acceptable y distance from the trunkEnd
  //         if (leaveYLevel < 3) {
  //           return leaveYLevel;
  //         }
  //       }
  //     }
  //   }

  //   return null;
  // }

  shouldSpawnTreeTrunkAt(x: number, y: number, z: number, surfaceY: number) {
    if (y < surfaceY || y > surfaceY + Tree.TRUNK_HEIGHT) {
      return false;
    }

    return this.getTreeMapValueAt(x, z) === TreeMapValue.TRUNK;
  }

  protected getTreeMapValueAt(x: number, z: number): TreeMapValue | undefined {
    return this.getPointData(x, z);
  }
}
