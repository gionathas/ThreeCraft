import { CHUNK_WIDTH } from "../../config/constants";
import Tree from "../../terrain/Tree";
import { isInRange, probability } from "../../utils/helpers";
import Abstract2DMap from "../Abstract2DMap";
import HeightMap from "../HeightMap";
import TreeMapValueEncoder from "./TreeMapValueEncoder";

export enum TreeMapType {
  EMPTY = 0,
  TRUNK = 1,
  LEAF = 2,
}

export type TreeMapValue = {
  type: TreeMapType;
  trunkHeight: number;
  trunkSurfaceY: number;
  trunkDistance: number;
};
export default class TreeMap extends Abstract2DMap {
  /**
   * The size of the tree map is the size of the chunk + the radius of the tree
   * because a tree can spawn on the edge of the chunk
   */
  static readonly MAP_SIZE = CHUNK_WIDTH + Tree.RADIUS * 2;
  protected heightMap: HeightMap;

  constructor(seed: string, heightMap: HeightMap) {
    super(seed);
    this.heightMap = heightMap;
  }

  shouldSpawnTreeLeafAt(x: number, y: number, z: number, surfaceY: number) {
    const value = this.getTreeMapValueAt(x, z);

    if (value == null) {
      return false;
    }

    const { type, trunkDistance, trunkHeight, trunkSurfaceY } =
      TreeMapValueEncoder.decode(value);

    const trunkEndY = trunkSurfaceY + trunkHeight;
    const yRange = y - trunkEndY;

    if (type === TreeMapType.TRUNK) {
      // leaf tip on top of the trunk
      if (yRange === 2) {
        return probability(0.5);
      }

      // leaf above the end of the trunk
      if (yRange === 1) {
        return true;
      }
    }

    // leaf on the side of the trunk
    if (type === TreeMapType.LEAF) {
      // leaf 2 level above the trunk and 2 block away
      if (trunkDistance === 2 && isInRange(yRange, -1, 0)) {
        return true;
      }

      // leaf 1 level above the trunk and 1 block away
      if (trunkDistance === 1 && isInRange(yRange, -1, 1)) {
        return true;
      }
    }

    return false;
  }

  shouldSpawnTreeTrunkAt(x: number, y: number, z: number, surfaceY: number) {
    const type = this.getTreeMapTypeAt(x, z);

    if (y < surfaceY || y > surfaceY + Tree.TRUNK_HEIGHT || type == null) {
      return false;
    }

    return type === TreeMapType.TRUNK;
  }

  protected getTreeMapTypeAt(x: number, z: number): TreeMapType | null {
    const value = this.getPointData(x, z);

    if (value != null) {
      return TreeMapValueEncoder.getType(value);
    }

    return null;
  }

  protected getTreeMapValueAt(x: number, z: number) {
    return this.getPointData(x, z);
  }
}
