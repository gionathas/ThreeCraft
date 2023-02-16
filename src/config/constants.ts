import { PlayerMode } from "../entities/Player";

/**
 * Game Settings
 */
export const TARGET_FRAME_RATE = 1 / 60;
export const DEFAULT_PLAYER_MODE: PlayerMode = "dev";

/**
 * Editing settings
 */
export const EDITING_ENABLED = true;
export const EDITING_DISTANCE = 7;

/**
 * Terrain Chunks
 */
export const CHUNK_WIDTH = 16;
export const CHUNK_HEIGHT = 16;

/**
 * Terrain Rendering
 *
 * HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS: 15
 * TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS: 5
 * BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS: 1
 */
export const TERRAIN_GENERATION_ENABLED = false;
export const TERRAIN_OPTIMIZATION_ENABLED = false;
export const HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS = 7;
export const TOP_RENDER_DISTANCE_IN_CHUNKS = 5;
export const BOTTOM_RENDER_DISTANCE_IN_CHUNKS = 5;

/**
 * Terrain Map Noise
 *
 */
export const TEST_MAP_ENABLED = true;
export const CONTINENTALNESS_NOISE_SCALE = 10000;
export const EROSION_NOISE_SCALE = 1024;
export const PV_BASE_SCALE = 180;

export const CONTINENTALNESS_MAX_HEIGHT = 30;
export const CONTINENTALNESS_MIN_HEIGHT = -30;

export const MIN_EROSION = 0;
export const MAX_EROSION = 50;

/**
 * Terrain Decoration
 */
export const MAX_WORLD_HEIGHT = TOP_RENDER_DISTANCE_IN_CHUNKS * CHUNK_HEIGHT;
export const MIN_WORLD_HEIGHT =
  BOTTOM_RENDER_DISTANCE_IN_CHUNKS * -CHUNK_HEIGHT;
export const MAX_TERRAIN_HEIGHT = CONTINENTALNESS_MAX_HEIGHT + MAX_EROSION;
export const MIN_TERRAIN_HEIGHT = CONTINENTALNESS_MIN_HEIGHT - MAX_EROSION;
export const SEA_LEVEL = CONTINENTALNESS_MIN_HEIGHT + 8;
export const CLOUD_LEVEL = MAX_TERRAIN_HEIGHT - 10;

/**
 * Physics
 */
export const FALLING_GRAVITY = 18;
export const JUMPING_GRAVITY = 15;
