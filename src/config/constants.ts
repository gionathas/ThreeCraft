import { PlayerMode } from "../entities/Player";

/**
 * Game Settings
 */
export const TARGET_FRAME_RATE = 1 / 60;
export const DEFAULT_PLAYER_MODE: PlayerMode = "dev";
export const SHOW_DEBUG_UI = getBoolean(import.meta.env.VITE_SHOW_DEBUG_UI);

/**
 * Editing settings
 */
export const EDITING_ENABLED = getBoolean(import.meta.env.VITE_EDITING_ENABLED);
export const EDITING_DISTANCE = 7;

/**
 * Terrain Chunks
 */
export const CHUNK_WIDTH = getNumber(import.meta.env.VITE_TERRAIN_CHUNK_WIDTH);
export const CHUNK_HEIGHT = getNumber(
  import.meta.env.VITE_TERRAIN_CHUNK_HEIGHT
);

/**
 * Terrain Generation
 */
export const TERRAIN_GENERATION_ENABLED = getBoolean(
  import.meta.env.VITE_TERRAIN_GENERATION_ENABLED
);
export const TERRAIN_OPTIMIZATION_ENABLED = getBoolean(
  import.meta.env.VITE_TERRAIN_OPTIMIZATION_ENABLED
);

/**
 * Rendering Distance
 */
export const DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS = getNumber(
  import.meta.env.VITE_DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS
);
export const TOP_RENDER_DISTANCE_IN_CHUNKS = getNumber(
  import.meta.env.VITE_TOP_RENDER_DISTANCE_IN_CHUNKS
);
export const BOTTOM_RENDER_DISTANCE_IN_CHUNKS = getNumber(
  import.meta.env.VITE_BOTTOM_RENDER_DISTANCE_IN_CHUNKS
);

/** Testing Map */
export const TESTING_MAP_ENABLED = getBoolean(
  import.meta.env.VITE_TESTING_MAP_ENABLED
);
export const TESTING_MAP_EROSION = getOptionalNumber(
  import.meta.env.VITE_TESTING_MAP_EROSION
);
export const TESTING_MAP_CONTINENTALNESS = getOptionalNumber(
  import.meta.env.VITE_TESTING_MAP_CONTINENTALNESS
);
export const TESTING_MAP_PV = getOptionalNumber(
  import.meta.env.VITE_TESTING_MAP_PV
);

/** Terrain Noise */
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
export const SEA_LEVEL = CONTINENTALNESS_MIN_HEIGHT + 15;
export const CLOUD_LEVEL = MAX_TERRAIN_HEIGHT - 10;

/**
 * Physics
 */
export const FALLING_GRAVITY = 18;
export const JUMPING_GRAVITY = 15;

/** Utilities */
function getBoolean(key: keyof ImportMetaEnv): boolean {
  return key === "true";
}

function getNumber(key: keyof ImportMetaEnv): number {
  return parseFloat(key as string);
}

function getOptionalNumber(key?: keyof ImportMetaEnv): number | undefined {
  if (key) {
    return parseFloat(key as string);
  }

  return undefined;
}
