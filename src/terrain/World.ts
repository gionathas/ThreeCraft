import EnvVars from "../config/EnvVars";
import { Chunk } from "./chunk";

export default class World {
  static CONTINENTALNESS_NOISE_SCALE = 10000;
  static EROSION_NOISE_SCALE = 1024;
  static PV_BASE_SCALE = 180;

  static MAX_WORLD_HEIGHT =
    EnvVars.TOP_RENDER_DISTANCE_IN_CHUNKS * Chunk.HEIGHT;
  static MIN_WORLD_HEIGHT =
    EnvVars.BOTTOM_RENDER_DISTANCE_IN_CHUNKS * -Chunk.HEIGHT;

  static MIN_EROSION = 0;
  static MAX_EROSION = 45;

  static CONTINENTALNESS_MIN_HEIGHT = 0;
  static CONTINENTALNESS_MAX_HEIGHT = this.CONTINENTALNESS_MIN_HEIGHT + 50;

  // WARN must be less than MAX_WORLD_HEIGHT
  static MAX_SURFACE_HEIGHT =
    this.CONTINENTALNESS_MAX_HEIGHT + this.MAX_EROSION;
  // WARN must be greater than MIN_WORLD_HEIGHT
  static MIN_SURFACE_HEIGHT =
    this.CONTINENTALNESS_MIN_HEIGHT - this.MAX_EROSION;

  static SEA_LEVEL = this.CONTINENTALNESS_MIN_HEIGHT + 10;
  static CLOUD_LEVEL = this.MAX_SURFACE_HEIGHT - 10;
}
