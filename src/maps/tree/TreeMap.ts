import { CHUNK_WIDTH } from "../../config/constants";
import Tree from "../../terrain/Tree";
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
  trunkSurfaceHeight: number;
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
    const type = this.getTreeMapTypeAt(x, z);

    if (
      y < surfaceY + Tree.LEAVES_START_Y ||
      y > surfaceY + Tree.LEAVES_END_Y ||
      type == null
    ) {
      return false;
    }

    const isTreeLeaf = type === TreeMapType.LEAF;

    return isTreeLeaf;
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
