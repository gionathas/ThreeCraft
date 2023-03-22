import EventEmitter from "events";

type State = "menu" | "loading" | "running" | "paused";

export default class GameState {
  private static instance: GameState;

  private state!: State;
  private eventsEmitter: EventEmitter;

  private constructor() {
    this.eventsEmitter = new EventEmitter();
    this.setState("menu");
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new GameState();
    }

    return this.instance;
  }

  onMenu(callback: () => void) {
    this.eventsEmitter.on("menu", callback);
  }

  onLoading(callback: () => void) {
    this.eventsEmitter.on("loading", callback);
  }

  onPaused(callback: () => void) {
    this.eventsEmitter.on("paused", callback);
  }

  onRunning(callback: () => void) {
    this.eventsEmitter.on("running", callback);
  }

  setState(state: State) {
    this.state = state;

    this.eventsEmitter.emit(state);
  }

  getState() {
    return this.state;
  }

  isInGame() {
    return this.state === "running" || this.state === "paused";
  }

  isRunning() {
    return this.state === "running";
  }

  isPaused() {
    return this.state === "paused";
  }
}
