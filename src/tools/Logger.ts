import EnvVars from "../config/EnvVars";

export type LogLevel = "debug" | "info" | "silent";

export default class Logger {
  private static readonly LOG_LEVELS: LogLevel[] =
    (EnvVars.LOG_LEVELS as LogLevel[]) ?? ["silent"];
  private static readonly LOG_KEYS = EnvVars.LOG_KEYS;

  // engine keys
  public static readonly GAME_LOOP_KEY = "gameloop";
  public static readonly SCENE_KEY = "scene";
  public static readonly AUDIO_KEY = "audio";
  public static readonly DATA_KEY = "data";
  public static readonly INPUT_KEY = "input";
  public static readonly MAP_KEY = "map";

  // entities
  public static readonly PLAYER_KEY = "player";
  public static readonly TERRAIN_KEY = "terrain";

  // phase keys
  public static readonly INIT_KEY = "init";
  public static readonly LOADING_KEY = "load";
  public static readonly DISPOSE_KEY = "dispose";

  static debug(msg: string, ...keys: string[]) {
    const shouldLog = this.shouldLog("debug", ...keys);

    if (shouldLog) {
      console.debug(msg);
    }
  }

  static info(msg: string, ...keys: string[]) {
    const shouldLog = this.shouldLog("info", ...keys);

    if (shouldLog) {
      console.info(msg);
    }
  }

  static warn(msg: string) {
    console.warn(msg);
  }

  static error(error: ErrorEvent) {
    console.error(error);
  }

  private static shouldLog(level: LogLevel, ...keys: string[]) {
    const matchLevel = Logger.LOG_LEVELS.includes(level);
    const matchSomeKeys = keys.some((key) => this.LOG_KEYS.includes(key));

    return matchSomeKeys && matchLevel;
  }
}
