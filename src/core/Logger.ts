import EnvVars from "../config/EnvVars";

export default class Logger {
  private static readonly LOG_KEYS = EnvVars.LOG_KEYS;

  public static readonly DISPOSE_KEY = "dispose";
  public static readonly AUDIO_KEY = "audio";

  static debug(msg: string, ...keys: string[]) {
    const shouldLog = this.shouldLog(...keys);

    if (shouldLog) {
      console.debug(msg);
    }
  }

  static info(msg: string, ...keys: string[]) {
    const shouldLog = this.shouldLog(...keys);

    if (shouldLog) {
      console.info(msg);
    }
  }

  private static shouldLog(...keys: string[]) {
    return keys.some((key) => this.LOG_KEYS.includes(key));
  }
}
