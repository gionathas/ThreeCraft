import EnvVars from "../config/EnvVars";

export type LogLevel = "debug" | "info" | "silent";

export default class Logger {
  private static readonly LOG_LEVELS: LogLevel[] =
    (EnvVars.LOG_LEVELS as LogLevel[]) ?? ["silent"];
  private static readonly LOG_KEYS = EnvVars.LOG_KEYS;

  // logging keys
  public static readonly ENGINE_KEY = "engine";
  public static readonly GAME_LOOP_KEY = "gameloop";

  public static readonly SCENE_KEY = "scene";
  public static readonly CAMERA_KEY = "camera";
  public static readonly AUDIO_KEY = "audio";
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

  private static shouldLog(level: LogLevel, ...keys: string[]) {
    const matchLevel = Logger.LOG_LEVELS.includes(level);
    const matchSomeKeys = keys.some((key) => this.LOG_KEYS.includes(key));

    return matchSomeKeys && matchLevel;
  }
}
