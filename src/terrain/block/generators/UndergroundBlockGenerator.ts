import TerrainShapeMap from "../../../maps/TerrainShapeMap";
import World from "../../World";
import { BlockType } from "../BlockType";
import BlockGenerator from "./BlockGenerator";

type DepthLevel = "Surface" | "Subsurface" | "Mid" | "Deep" | "BedRock";

export default class UndergroundBlockGenerator extends BlockGenerator {
  constructor(terrainShapeMap: TerrainShapeMap) {
    super(terrainShapeMap);
  }

  generateBlock(x: number, y: number, z: number): BlockType {
    const surfaceY = this.terrainShapeMap.getSurfaceHeightAt(x, z);
    const depthLevel = this.getDepthLevel(y, surfaceY);

    switch (depthLevel) {
      case "Surface":
        return this.getSurfaceBlockType(x, y, z);
      case "Subsurface":
        return this.getSubSurfaceBlockType(x, y, z);
      default:
        return BlockType.STONE;
    }
  }

  private getSurfaceBlockType(x: number, y: number, z: number): BlockType {
    if (this.shouldSpawnSnow(x, y, z)) {
      return BlockType.GRASS_SNOW;
    }

    if (this.shouldSpawnSand(x, y, z)) {
      return BlockType.SAND;
    }

    if (y < World.SEA_LEVEL - 1) {
      return BlockType.DIRT;
    }

    if (this.shouldSpanwSurfaceStone(x, y, z)) {
      return BlockType.STONE;
    }

    return BlockType.GRASS;
  }

  private getSubSurfaceBlockType(x: number, y: number, z: number): BlockType {
    if (this.shouldSpawnSand(x, y, z)) {
      return BlockType.SAND;
    }

    if (this.shouldSpanwSurfaceStone(x, y, z)) {
      return BlockType.STONE;
    }

    return BlockType.DIRT;
  }

  private shouldSpawnSand(x: number, y: number, z: number): boolean {
    const continentalType = this.getContinentalTypeAt(x, z);

    return (
      y <= World.SAND_LEVEL &&
      (continentalType === "Coast" || continentalType === "Ocean")
    );
  }

  private shouldSpanwSurfaceStone(x: number, y: number, z: number): boolean {
    const pvType = this.getPvTypeAt(x, z);
    const continentalType = this.getContinentalTypeAt(x, z);
    const erosionType = this.getErosionTypeAt(x, z);

    const isFarInland = continentalType === "Far_Inland";
    const isLand = continentalType === "Inland";

    const isHighErosion = erosionType === "Flat";
    const isLowErosion = erosionType === "VeryLow" || erosionType === "Low";
    const isVeryLowErosion = erosionType === "VeryLow";

    const isValley = pvType === "Valley";
    const isLowPv = pvType === "Valley" || pvType === "Low";

    const case1 = isFarInland && isVeryLowErosion && isLowPv;
    const case2 = isFarInland && isLowErosion && isValley;
    const case3 = (isLand || isFarInland) && isHighErosion && isLowPv;

    return case1 || case2 || case3;
  }

  private shouldSpawnSnow(x: number, y: number, z: number) {
    const continentalType = this.getContinentalTypeAt(x, z);

    const isFarInland = continentalType === "Far_Inland";
    const isAboveSnowLevel = y >= World.SNOW_LEVEL;

    return isFarInland && isAboveSnowLevel;
  }

  private getDepthLevel(y: number, surfaceY: number): DepthLevel {
    const distFromSurface = Math.abs(y - surfaceY);

    if (distFromSurface <= 1) {
      return "Surface";
    }

    if (distFromSurface <= 5) {
      return "Subsurface";
    }

    if (y <= World.BEDROCK_LEVEL) {
      return "BedRock";
    }

    if (y <= World.MIN_SURFACE_HEIGHT - 5) {
      return "Deep";
    }

    return "Mid";
  }
}
