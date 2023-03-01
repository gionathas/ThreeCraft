import ContinentalMap from "../maps/ContinentalMap";
import ErosionMap, { ErosionType } from "../maps/ErosionMap";
import PVMap, { PVType } from "../maps/PVMap";

type BiomeType =
  | "None"
  | "Mountain"
  | "Plain"
  | "Mid"
  | "Forest"
  | "Beach"
  | "River"
  | "Ocean";

// create a type which combine erosion type and pv type
type ErosionPVType = `${ErosionType}_${PVType}`;

export default class Biome {
  //   private static readonly FarInlandBiomes: Record<ErosionPVType, BiomeType[]> =
  //     {
  //       // very low erosion
  //       VeryLow_Peak: ["MountainPeak"],
  //       VeryLow_High: ["Mountain"],
  //       VeryLow_Mid: ["Plain"],
  //       VeryLow_Plateau: ["Plain", "Mid"],
  //       VeryLow_Low: ["Plain"],
  //       VeryLow_Valley: ["Plain"],
  //       // low erosion
  //       Low_Peak: ["MountainPeak"],
  //       Low_High: ["Mountain"],
  //       Low_Mid: ["Plain"],
  //       Low_Plateau: ["Plain", "Mid"],
  //       Low_Low: ["Plain"],
  //       Low_Valley: ["Plain"],
  //       // mid erosion
  //       Mid_Peak: ["Plain", "Mid"],
  //       Mid_High: ["Plain", "Mid"],
  //       Mid_Mid: ["Plain", "Mid"],
  //       Mid_Plateau: ["Plain", "Mid"],
  //       Mid_Low: ["Plain"],
  //       Mid_Valley: ["Plain"],
  //       // mid spike erosion
  //       MidSpike_Peak: ["Mountain"],
  //       MidSpike_High: ["Mountain"],
  //       MidSpike_Mid: ["Plain"],
  //       MidSpike_Plateau: ["Plain"],
  //       MidSpike_Low: ["Plain"],
  //       MidSpike_Valley: ["Plain"],
  //       // flat spike erosion
  //       FlatSpike_Peak: ["Mountain"],
  //       FlatSpike_High: ["Mountain"],
  //       FlatSpike_Mid: ["Plain"],
  //       FlatSpike_Plateau: ["Plain"],
  //       FlatSpike_Low: ["Plain"],
  //       FlatSpike_Valley: ["Plain"],
  //       // mid low erosion
  //       MidLow_Peak: ["Mountain"],
  //       MidLow_High: ["Mountain"],
  //       MidLow_Mid: ["Plain"],
  //       MidLow_Plateau: ["Plain"],
  //       MidLow_Low: ["Plain"],
  //       MidLow_Valley: ["Plain"],
  //       // flat erosion
  //       Flat_Peak: ["Plain"],
  //       Flat_High: ["Plain"],
  //       Flat_Mid: ["Plain"],
  //       Flat_Plateau: ["Plain"],
  //       Flat_Low: ["Plain"],
  //       Flat_Valley: ["Plain"],
  //     };

  static detect(
    continentalness: number,
    erosion: number,
    pv: number,
    surfaceY: number
  ): BiomeType {
    const continentalType = ContinentalMap.getType(continentalness);
    const pvType = PVMap.getType(pv);
    const erosionType = ErosionMap.getType(erosion);

    if (continentalType === "Far_Inland" && surfaceY > 60) {
      return "Mountain";
    }

    if (continentalType === "Far_Inland" && surfaceY > 40) {
    }

    return "Plain";
  }
}
