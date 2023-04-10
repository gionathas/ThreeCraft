/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Logging
  readonly VITE_LOG_LEVELS: string;
  readonly VITE_LOG_KEYS: string;

  // Game settings
  readonly VITE_JUMP_START: string;

  // Gameplay settings
  readonly VITE_FOG_ENABLED: string;
  readonly VITE_EDITING_ENABLED: string;

  // UI
  readonly VITE_SHOW_INITIAL_TERRAIN_GENERATION: string;
  readonly VITE_SHOW_DEBUG_UI: string;
  readonly VITE_SHOW_WINDOW_CLOSE_ALERT: string;

  // Terrain Generation
  readonly VITE_CUSTOM_SEED?: string;
  readonly VITE_TERRAIN_GENERATION_ENABLED: string;
  readonly VITE_TERRAIN_OPTIMIZATION_ENABLED: string;
  readonly VITE_TREE_GENERATION_ENABLED: string;

  // Terrain Chunks
  readonly VITE_TERRAIN_CHUNK_WIDTH: number;
  readonly VITE_TERRAIN_CHUNK_HEIGHT: number;

  // Rendering Distance
  readonly VITE_DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS: number;
  readonly VITE_TOP_RENDER_DISTANCE_IN_CHUNKS: number;
  readonly VITE_BOTTOM_RENDER_DISTANCE_IN_CHUNKS: number;

  // Testing Map
  readonly VITE_TESTING_MAP_ENABLED: string;
  readonly VITE_TESTING_MAP_EROSION?: number;
  readonly VITE_TESTING_MAP_CONTINENTALNESS?: number;
  readonly VITE_TESTING_MAP_PV?: number;

  // Inventory
  readonly VITE_STARTING_INVENTORY_ITEMS: string;
  readonly VITE_STARTING_HOTBAR_ITEMS: number;

  // Player
  readonly VITE_PLAYER_DEFAULT_PHYSICS_MODE: string;
  readonly VITE_PLAYER_SHOW_BOUNDING_BOX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
