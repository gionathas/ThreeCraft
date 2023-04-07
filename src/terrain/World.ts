import { Vector3 } from "three";
import EnvVars from "../config/EnvVars";

export default class World {
  static readonly ORIGIN = new Vector3(0, 0, 0);

  static readonly CONTINENTALNESS_NOISE_SCALE = 2500;
  static readonly EROSION_NOISE_SCALE = 1024;
  static readonly PV_BASE_SCALE = 180;
  static readonly DENSITY_NOISE_SCALE = 32;

  static readonly MAX_WORLD_HEIGHT =
    EnvVars.TOP_RENDER_DISTANCE_IN_CHUNKS * EnvVars.CHUNK_HEIGHT;
  static readonly MIN_WORLD_HEIGHT =
    EnvVars.BOTTOM_RENDER_DISTANCE_IN_CHUNKS * -EnvVars.CHUNK_HEIGHT;

  static readonly MIN_EROSION = 0;
  static readonly MAX_EROSION = 45;

  static readonly MIN_CONTINENTALNESS_HEIGHT = 0;
  static readonly MAX_CONTINENTALNESS_HEIGHT = 50;

  static readonly MIN_DENSITY_HEIGHT = this.MIN_CONTINENTALNESS_HEIGHT - 40;
  static readonly MAX_DENSITY_HEIGHT = this.MAX_WORLD_HEIGHT;
  static readonly LARGE_CAVES_HEIGHT = this.MIN_CONTINENTALNESS_HEIGHT - 10;

  // WARN must be less than MAX_WORLD_HEIGHT
  static readonly MAX_SURFACE_HEIGHT =
    this.MAX_CONTINENTALNESS_HEIGHT + this.MAX_EROSION;
  // WARN must be greater than MIN_WORLD_HEIGHT
  static readonly MIN_SURFACE_HEIGHT =
    this.MIN_CONTINENTALNESS_HEIGHT - this.MAX_EROSION;

  static readonly CLOUD_LEVEL = this.MAX_SURFACE_HEIGHT - 10;
  static readonly SNOW_LEVEL = this.MAX_CONTINENTALNESS_HEIGHT;

  static readonly SEA_LEVEL = this.MIN_CONTINENTALNESS_HEIGHT + 15;
  static readonly SAND_LEVEL = World.SEA_LEVEL + 6;

  static readonly BEDROCK_LEVEL = World.MIN_WORLD_HEIGHT / 6;

  static generateSeed() {
    return Math.random().toString(36).substring(2, 15);
  }
}
