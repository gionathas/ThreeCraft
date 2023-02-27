import EnvVars from "../config/EnvVars";
import { Chunk } from "./chunk";

export default class World {
  static readonly CONTINENTALNESS_NOISE_SCALE = 10000;
  static readonly EROSION_NOISE_SCALE = 1024;
  static readonly PV_BASE_SCALE = 180;

  static readonly MAX_WORLD_HEIGHT =
    EnvVars.TOP_RENDER_DISTANCE_IN_CHUNKS * Chunk.HEIGHT;
  static readonly MIN_WORLD_HEIGHT =
    EnvVars.BOTTOM_RENDER_DISTANCE_IN_CHUNKS * -Chunk.HEIGHT;

  static readonly MIN_EROSION = 0;
  static readonly MAX_EROSION = 45;

  static readonly CONTINENTALNESS_MIN_HEIGHT = 0;
  static readonly CONTINENTALNESS_MAX_HEIGHT =
    this.CONTINENTALNESS_MIN_HEIGHT + 50;

  // WARN must be less than MAX_WORLD_HEIGHT
  static readonly MAX_SURFACE_HEIGHT =
    this.CONTINENTALNESS_MAX_HEIGHT + this.MAX_EROSION;
  // WARN must be greater than MIN_WORLD_HEIGHT
  static readonly MIN_SURFACE_HEIGHT =
    this.CONTINENTALNESS_MIN_HEIGHT - this.MAX_EROSION;

  static readonly SEA_LEVEL = this.CONTINENTALNESS_MIN_HEIGHT + 10;
  static readonly CLOUD_LEVEL = this.MAX_SURFACE_HEIGHT - 10;
}
