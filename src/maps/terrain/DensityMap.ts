import World from "../../terrain/World";
import { Map2D, Map3D } from "../AbstractMap";
import { Noise3DMap } from "../Noise3DMap";
import ErosionMap from "./ErosionMap";
import PVMap from "./PVMap";

export default class DensityMap extends Noise3DMap implements Map3D {
  private readonly SOLID = 1;
  private readonly AIR = -1;

  private erosionMap: Map2D;
  private pvMap: Map2D;

  constructor(seed: string, erosionMap: Map2D, pvMap: Map2D) {
    super(seed);
    this.erosionMap = erosionMap;
    this.pvMap = pvMap;
  }

  setValueAt(x: number, y: number, z: number, value: number): number {
    return this.setPointData(x, y, z, value);
  }

  getValueAt(x: number, y: number, z: number): number {
    return this.getDensityAt(x, y, z);
  }

  private getDensityAt(x: number, y: number, z: number): number {
    const { AIR, SOLID } = this;

    if (y < World.MIN_DENSITY_HEIGHT) {
      return SOLID;
    }

    if (y > World.MAX_DENSITY_HEIGHT) {
      return AIR;
    }

    const scale = this.getScaleFactorAt(x, y, z);
    const squashingFactor = this.getSquashingFactorAt(x, y, z);
    return this.noise3D(x / scale, y / scale, z / scale) + squashingFactor;
  }

  /** Determine the deepness of the cave */
  private getScaleFactorAt(x: number, y: number, z: number): number {
    if (y < World.LARGE_CAVES_HEIGHT) {
      return 256;
    }

    return 36;
  }

  /** Determine the probability of the terrain to be carved out */
  private getSquashingFactorAt(x: number, y: number, z: number): number {
    const erosion = this.erosionMap.getValueAt(x, z);
    const pv = this.pvMap.getValueAt(x, z);

    const erosionType = ErosionMap.getType(erosion);
    const isHighPv = pv >= PVMap.NoiseRange.Mid.min;

    switch (erosionType) {
      case "VeryLow": {
        return isHighPv ? 0.6 : 0.8;
      }
      case "Low":
        return isHighPv ? 0.8 : 0.9;

      case "MidLow":
        return isHighPv ? 0.9 : 0.9;

      default:
        // no chance
        return 1;
    }
  }
}
