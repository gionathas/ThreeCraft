import { PlayerMode } from "../entities/Player";

export default class EnvVars {
  /**
   * Game Settings
   */
  static readonly TARGET_FRAME_RATE = 1 / 60;
  static readonly DEFAULT_PLAYER_MODE: PlayerMode = "dev";

  /**
   * UI Settings
   */
  static readonly SHOW_DEBUG_UI = this.getBoolean(
    import.meta.env.VITE_SHOW_DEBUG_UI
  );

  /**
   * Editing settings
   */
  static readonly EDITING_ENABLED = this.getBoolean(
    import.meta.env.VITE_EDITING_ENABLED
  );

  /**
   * Terrain Chunks
   */
  static readonly CHUNK_WIDTH = this.getNumber(
    import.meta.env.VITE_TERRAIN_CHUNK_WIDTH
  );
  static readonly CHUNK_HEIGHT = this.getNumber(
    import.meta.env.VITE_TERRAIN_CHUNK_HEIGHT
  );

  /**
   * Terrain Generation
   */
  static readonly TERRAIN_GENERATION_ENABLED = this.getBoolean(
    import.meta.env.VITE_TERRAIN_GENERATION_ENABLED
  );
  static readonly TERRAIN_OPTIMIZATION_ENABLED = this.getBoolean(
    import.meta.env.VITE_TERRAIN_OPTIMIZATION_ENABLED
  );
  static readonly TREE_GENERATION_ENABLED = this.getBoolean(
    import.meta.env.VITE_TREE_GENERATION_ENABLED
  );

  /**
   * Rendering Distance
   */
  static readonly DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS = this.getNumber(
    import.meta.env.VITE_DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS
  );
  static readonly TOP_RENDER_DISTANCE_IN_CHUNKS = this.getNumber(
    import.meta.env.VITE_TOP_RENDER_DISTANCE_IN_CHUNKS
  );
  static readonly BOTTOM_RENDER_DISTANCE_IN_CHUNKS = this.getNumber(
    import.meta.env.VITE_BOTTOM_RENDER_DISTANCE_IN_CHUNKS
  );

  /** Testing Map */
  static readonly TESTING_MAP_ENABLED = this.getBoolean(
    import.meta.env.VITE_TESTING_MAP_ENABLED
  );
  static readonly TESTING_MAP_EROSION = this.getOptionalNumber(
    import.meta.env.VITE_TESTING_MAP_EROSION
  );
  static readonly TESTING_MAP_CONTINENTALNESS = this.getOptionalNumber(
    import.meta.env.VITE_TESTING_MAP_CONTINENTALNESS
  );
  static readonly TESTING_MAP_PV = this.getOptionalNumber(
    import.meta.env.VITE_TESTING_MAP_PV
  );

  /** Inventory */
  static readonly DEV_INVENTORY_ENABLED = this.getBoolean(
    import.meta.env.VITE_DEV_INVENTORY_ENABLED
  );
  static readonly DEV_INVENTORY_ITEMS = this.getList(
    import.meta.env.VITE_DEV_INVENTORY_ITEMS
  ).map((item) => Number(item));

  static readonly DEV_HOTBAR_ITEMS = this.getList(
    import.meta.env.VITE_DEV_HOTBAR_ITEMS
  ).map((item) => Number(item));

  /** Utilities */
  private static getList(key: keyof ImportMetaEnv): string[] {
    return (key as string).split(",").map((item) => item.trim());
  }

  private static getBoolean(key: keyof ImportMetaEnv): boolean {
    return key === "true";
  }

  private static getNumber(key: keyof ImportMetaEnv): number {
    return parseFloat(key as string);
  }

  private static getOptionalNumber(
    key?: keyof ImportMetaEnv
  ): number | undefined {
    if (key) {
      return parseFloat(key as string);
    }

    return undefined;
  }
}
