import { PhysicsMode } from "../player/PlayerPhysics";

export default class EnvVars {
  /** Logging */
  static readonly LOG_LEVELS = EnvVars.getList(import.meta.env.VITE_LOG_LEVELS);
  static readonly LOG_KEYS = EnvVars.getList(import.meta.env.VITE_LOG_KEYS);

  /** Game Settings */
  static readonly JUMP_START = EnvVars.getBoolean(
    import.meta.env.VITE_JUMP_START,
    false
  );

  /** Gameplay Settings */
  static readonly FOG_ENABLED = EnvVars.getBoolean(
    import.meta.env.VITE_FOG_ENABLED,
    true
  );
  static readonly EDITING_ENABLED = EnvVars.getBoolean(
    import.meta.env.VITE_EDITING_ENABLED,
    true
  );

  /** UI */
  static readonly SHOW_INITIAL_TERRAIN_GENERATION = EnvVars.getBoolean(
    import.meta.env.VITE_SHOW_INITIAL_TERRAIN_GENERATION,
    false
  );
  static readonly SHOW_DEBUG_INFO = EnvVars.getBoolean(
    import.meta.env.VITE_SHOW_DEBUG_UI,
    false
  );
  static readonly SHOW_WINDOW_CLOSE_ALERT = EnvVars.getBoolean(
    import.meta.env.VITE_SHOW_WINDOW_CLOSE_ALERT,
    true
  );

  /** Player */
  static readonly PLAYER_DEFAULT_PHYSICS_MODE = import.meta.env
    .VITE_PLAYER_DEFAULT_PHYSICS_MODE as PhysicsMode;
  static readonly PLAYER_SHOW_BOUNDING_BOX: boolean = EnvVars.getBoolean(
    import.meta.env.VITE_PLAYER_SHOW_BOUNDING_BOX,
    false
  );

  /**
   * Terrain Chunks
   */
  static readonly CHUNK_WIDTH = EnvVars.getNumber(
    import.meta.env.VITE_TERRAIN_CHUNK_WIDTH
  );
  static readonly CHUNK_HEIGHT = EnvVars.getNumber(
    import.meta.env.VITE_TERRAIN_CHUNK_HEIGHT
  );

  /**
   * Terrain Generation
   */
  static readonly CUSTOM_SEED = import.meta.env.VITE_CUSTOM_SEED;
  static readonly TERRAIN_GENERATION_ENABLED = EnvVars.getBoolean(
    import.meta.env.VITE_TERRAIN_GENERATION_ENABLED,
    true
  );
  static readonly TERRAIN_OPTIMIZATION_ENABLED = EnvVars.getBoolean(
    import.meta.env.VITE_TERRAIN_OPTIMIZATION_ENABLED,
    true
  );
  static readonly TREE_GENERATION_ENABLED = EnvVars.getBoolean(
    import.meta.env.VITE_TREE_GENERATION_ENABLED,
    true
  );

  /**
   * Rendering Distance
   */
  static readonly DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS =
    EnvVars.getNumber(
      import.meta.env.VITE_DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS
    );
  static readonly TOP_RENDER_DISTANCE_IN_CHUNKS = EnvVars.getNumber(
    import.meta.env.VITE_TOP_RENDER_DISTANCE_IN_CHUNKS
  );
  static readonly BOTTOM_RENDER_DISTANCE_IN_CHUNKS = EnvVars.getNumber(
    import.meta.env.VITE_BOTTOM_RENDER_DISTANCE_IN_CHUNKS
  );

  /** Testing Map */
  static readonly TESTING_MAP_ENABLED = EnvVars.getBoolean(
    import.meta.env.VITE_TESTING_MAP_ENABLED,
    false
  );
  static readonly TESTING_MAP_EROSION = EnvVars.getOptionalNumber(
    import.meta.env.VITE_TESTING_MAP_EROSION
  );
  static readonly TESTING_MAP_CONTINENTALNESS = EnvVars.getOptionalNumber(
    import.meta.env.VITE_TESTING_MAP_CONTINENTALNESS
  );
  static readonly TESTING_MAP_PV = EnvVars.getOptionalNumber(
    import.meta.env.VITE_TESTING_MAP_PV
  );

  /** Inventory */
  static readonly STARTING_INVENTORY_ITEMS = EnvVars.getList(
    import.meta.env.VITE_STARTING_INVENTORY_ITEMS
  ).map((item) => Number(item));

  static readonly STARTING_HOTBAR_ITEMS = EnvVars.getList(
    import.meta.env.VITE_STARTING_HOTBAR_ITEMS
  ).map((item) => Number(item));

  /** Utilities */
  private static getList(key: keyof ImportMetaEnv): string[] {
    if (!key) {
      return [];
    }

    return (key as string).split(",").map((item) => item.trim());
  }

  private static getBoolean(
    key: keyof ImportMetaEnv,
    defaultValue: boolean
  ): boolean {
    if (key) {
      return key === "true";
    }

    return defaultValue;
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
