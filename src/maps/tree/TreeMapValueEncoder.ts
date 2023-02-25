import { TreeMapType, TreeMapValue } from "./TreeMap";

/**
 * This class is used to encode and decode a tree map value
 *
 * A tree map value is a 16 bit integer
 * The 16 bit integer is composed of 4 parts:
 * - 2 bit for the type (max 3)
 * - 4 bit for the trunk height (max 15)
 * - 8 bit for the trunk surface height (max 255)
 * - 2 bit for the distance from the trunk (max 3)
 */
export default class TreeMapValueEncoder {
  // 2 bit for the type (max 3)
  static readonly TYPE_MASK = 0b1100000000000000;
  // 4 bit for the trunk height (max 15)
  static readonly TRUNK_HEIGHT_MASK = 0b0011110000000000;
  // 8 bit for the trunk surface height (max 255)
  static readonly TRUNK_SURFACE_HEIGHT_MASK = 0b0000001111111100;
  // 2 bit for the distance from the trunk (max 3)
  static readonly TRUNK_DISTANCE_MASK = 0b0000000000000011;

  static encode(value: TreeMapValue): number {
    let encodedValue = 0;
    encodedValue = this.setType(encodedValue, value.type);
    encodedValue = this.setTrunkHeight(encodedValue, value.trunkHeight);
    encodedValue = this.setTrunkSurfaceHeight(
      encodedValue,
      value.trunkSurfaceHeight
    );
    encodedValue = this.setTrunkDistance(encodedValue, value.trunkDistance);
    return encodedValue;
  }

  static decode(value: number): TreeMapValue {
    return {
      type: this.getType(value),
      trunkHeight: this.getTrunkHeight(value),
      trunkSurfaceHeight: this.getTrunkSurfaceHeight(value),
      trunkDistance: this.getTrunkDistance(value),
    };
  }

  static getType(value: number): TreeMapType {
    return (value & this.TYPE_MASK) >> 14;
  }

  static setType(value: number, type: TreeMapType): number {
    return (value |= (type << 14) & this.TYPE_MASK);
  }

  static getTrunkHeight(value: number): number {
    return (value & this.TRUNK_HEIGHT_MASK) >> 10;
  }

  static setTrunkHeight(value: number, height: number): number {
    return (value |= (height << 10) & this.TRUNK_HEIGHT_MASK);
  }

  static getTrunkSurfaceHeight(value: number): number {
    return (value & this.TRUNK_SURFACE_HEIGHT_MASK) >> 2;
  }

  static setTrunkSurfaceHeight(value: number, height: number): number {
    return (value |= (height << 2) & this.TRUNK_SURFACE_HEIGHT_MASK);
  }

  static getTrunkDistance(value: number): number {
    return value & this.TRUNK_DISTANCE_MASK;
  }

  static setTrunkDistance(value: number, distance: number): number {
    return (value |= distance & this.TRUNK_DISTANCE_MASK);
  }
}
