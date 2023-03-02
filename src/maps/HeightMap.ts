import World from "../terrain/World";
import { lerp } from "../utils/helpers";
import Abstract2DMap from "./Abstract2DMap";
import ContinentalMap from "./ContinentalMap";
import ErosionMap from "./ErosionMap";
import PVMap from "./PVMap";

export default class HeightMap extends Abstract2DMap {
  private continentalMap: ContinentalMap;
  private erosionMap: ErosionMap;
  private pvMap: PVMap;

  constructor(
    seed: string,
    continentalMap: ContinentalMap,
    erosionMap: ErosionMap,
    pvMap: PVMap
  ) {
    super(seed);
    this.continentalMap = continentalMap;
    this.erosionMap = erosionMap;
    this.pvMap = pvMap;
  }

  getSurfaceHeightAt(x: number, z: number) {
    const cachedValue = this.getPointData(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const continentalness = this.getContinentalness(x, z);
    const baseHeight = this.getBaseHeight(continentalness);

    const erosion = this.getErosion(x, z);
    const erosionFactor = this.getErosionFactor(erosion);

    const pv = this.getPV(x, z, erosion);
    const pvHeight = this.getPvHeight(pv, erosionFactor);

    const height = baseHeight + pvHeight;

    this.setPointData(x, z, height);
    return height;
  }

  private getBaseHeight(continentalness: number) {
    return lerp(
      World.MIN_CONTINENTALNESS_HEIGHT,
      World.MAX_CONTINENTALNESS_HEIGHT,
      (continentalness + 1) / 2
    );
  }

  // high erosion -> flatter terrain
  // low erosion -> steeper terrain
  private getErosionFactor(erosion: number) {
    const min = World.MIN_EROSION;
    const max = World.MAX_EROSION;
    const midPeak = Math.floor(max * (1 / 2));

    const lowSlope = min + 6; // 6
    const midSlope = lowSlope * 2; // 12
    const highSlope = midSlope * 2; // 24

    const erosionType = ErosionMap.getType(erosion);
    const [minN, maxN] = ErosionMap.NoiseRange[erosionType];

    // inverse lerp
    const t = (erosion - minN) / (maxN - minN);
    const invT = (maxN - erosion) / (maxN - minN);

    switch (erosionType) {
      case "Flat":
        return lerp(min, lowSlope, invT);
      case "FlatSpike":
        return lerp(lowSlope, midPeak, invT);
      case "MidLow":
        return midPeak;
      case "MidSpike":
        return lerp(lowSlope, midPeak, t);
      case "Mid":
        return lerp(lowSlope, midSlope, invT);
      case "Low":
        return lerp(midSlope, highSlope, invT);
      case "VeryLow":
        return lerp(highSlope, max, invT);
    }
  }

  private getPvHeight(pv: number, erosionHeight: number) {
    const min = Math.round(-erosionHeight * (2 / 3));
    const mid = Math.round(-erosionHeight / 4);

    const peak = erosionHeight;
    const midPeak = Math.round(peak * (1 / 2));

    const pvType = PVMap.getType(pv);
    const [minN, maxN] = PVMap.NoiseRange[pvType];
    const t = (pv - minN) / (maxN - minN);

    switch (pvType) {
      case "Valley":
        return min;
      case "Low": {
        return lerp(min, mid, t);
      }
      case "Plateau": {
        return lerp(mid, mid + 2, t);
      }
      case "Mid": {
        return lerp(mid + 2, midPeak, t);
      }
      case "High": {
        return lerp(midPeak, peak, t);
      }
      case "Peak":
        return peak;
    }
  }

  private getContinentalness(x: number, z: number): number {
    return this.continentalMap.getContinentalnessAt(x, z);
  }

  private getErosion(x: number, z: number): number {
    return this.erosionMap.getErosionAt(x, z);
  }

  private getPV(x: number, z: number, erosion?: number): number {
    return this.pvMap.getPVAt(x, z, erosion);
  }
}
