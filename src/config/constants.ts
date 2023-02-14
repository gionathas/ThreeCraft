import { PlayerMode } from "../entities/Player";

/**
 * Game Settings
 */
export const TARGET_FRAME_RATE = 1 / 60;
export const PLAYER_MODE: PlayerMode = "dev";

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
export const HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS = 6;
export const TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS = 5;
export const BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS = 3;

export const HEIGHT_FACTOR = 100;
export const NOISE_SCALE = 70;

/**
 * Terrain Decoration
 */
export const SEA_LEVEL = -15;
export const CLOUD_LEVEL = 100;

/**
 * Physics
 */
export const FALLING_GRAVITY = 18;
export const JUMPING_GRAVITY = 15;
