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

    // get the surface height at the trunk
    return true;
  }

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
