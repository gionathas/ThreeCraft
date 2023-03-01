import ContinentalMap from "../../../maps/ContinentalMap";
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
    const continentalness = this.terrainShapeMap.getContinentalnessAt(x, z);
    const continentalType = ContinentalMap.getType(continentalness);

    const isAboveSnowLevel = y >= World.SNOW_LEVEL;

    if (isAboveSnowLevel) {
      //FIXME
      return BlockType.COBBLESTONE;
    }

    if (
      this.isBelorOrNearSeaLevel(y) &&
      (continentalType === "Coast" || continentalType === "Ocean")
    ) {
      return BlockType.SAND;
    }

    return BlockType.GRASS;
  }

  private getSubSurfaceBlockType(x: number, y: number, z: number): BlockType {
    if (this.isBelorOrNearSeaLevel(y)) {
      return BlockType.SAND;
    }

    return BlockType.DIRT;
  }

  private isBelorOrNearSeaLevel(y: number): boolean {
    return y <= World.SEA_LEVEL + 4;
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
}
