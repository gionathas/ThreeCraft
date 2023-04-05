export default class Logger {
  static debug(text: string) {
    if (import.meta.env.DEV) {
      console.log(text);
    }
  }
}
