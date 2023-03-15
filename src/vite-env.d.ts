/// <reference types="vite/client" />

interface ImportMetaEnv {
  // UI
  readonly VITE_SHOW_DEBUG_UI: string;

  // Editing settings
  readonly VITE_EDITING_ENABLED: string;

  // Terrain Generation
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
  readonly VITE_DEV_INVENTORY_ENABLED: string;
  readonly VITE_DEV_INVENTORY_ITEMS: string;
  readonly VITE_DEV_HOTBAR_ITEMS: number;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
