export default abstract class MapManager {
  protected seed: string;

  protected static getContinentalMapSeed = (seed: string) =>
    seed + "_continental";
  protected static getErosionMapSeed = (seed: string) => seed + "_erosion";
  protected static getPvMapSeed = (seed: string) => seed + "_pv";
  protected static getHeightMapSeed = (seed: string) => seed + "_height";
  protected static getDensityMapSeed = (seed: string) => seed + "_density";
  protected static getTreeMapSeed = (seed: string) => seed + "_tree";

  constructor(seed: string) {
    this.seed = seed;
  }

  getSeed() {
    return this.seed;
  }
}
