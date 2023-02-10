/**
 * Game Settings
 */
export const TARGET_FRAME_RATE = 1 / 60;

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
 * Terrain Generation
 *
 * Top Config
 * HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS: 15
 * TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS: 5
 * BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS: 1
 */
export const TERRAIN_GENERATION_ENABLED = true;
export const HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS = 20;
export const TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS = 3;
export const BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS = 1;

/**
 * Terrain Decoration
 */
export const NOISE_SCALE = 150;
export const BASE_HEIGHT = 10;
export const HILL_OFFSET = 20;
export const TERRAIN_LEVEL = -20;
export const SEA_LEVEL = 3;
export const CLOUD_LEVEL = 70;

/**
 * Physics
 */
export const FALLING_GRAVITY = 18;
export const JUMPING_GRAVITY = 15;
