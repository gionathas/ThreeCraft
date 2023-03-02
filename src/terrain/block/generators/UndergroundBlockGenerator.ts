import ContinentalMap, { ContinentalType } from "../../../maps/ContinentalMap";
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
    const isAboveSnowLevel = y >= World.SNOW_LEVEL;

    if (isAboveSnowLevel) {
      return BlockType.GRASS_SNOW;
    }

    if (this.shouldSpawnSand(x, y, z)) {
      return BlockType.SAND;
    }

    if (y < World.SEA_LEVEL - 1) {
      return BlockType.DIRT;
    }

    return BlockType.GRASS;
  }

  private getSubSurfaceBlockType(x: number, y: number, z: number): BlockType {
    if (this.shouldSpawnSand(x, y, z)) {
      return BlockType.SAND;
    }

    return BlockType.DIRT;
  }

  private shouldSpawnSand(x: number, y: number, z: number): boolean {
    const continentalType = this.getContinentalType(x, z);

    return (
      y <= World.SEA_LEVEL + 4 &&
      (continentalType === "Coast" || continentalType === "Ocean")
    );
  }

  private getDepthLevel(y: number, surfaceY: number): DepthLevel {
    const distFromSurface = Math.abs(y - surfaceY);

    if (distFromSurface <= 1) {
      return "Surface";
    }

    if (distFromSurface <= 5) {
      return "Subsurface";
    }

    if (y <= World.MIN_WORLD_HEIGHT / 6) {
      return "BedRock";
    }

    if (y <= World.MIN_SURFACE_HEIGHT - 5) {
      return "Deep";
    }

    return "Mid";
  }

  private getContinentalType(x: number, z: number): ContinentalType {
    const continentalness = this.terrainShapeMap.getContinentalnessAt(x, z);
    return ContinentalMap.getType(continentalness);
  }
}
