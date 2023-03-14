type State = "ready" | "loading" | "running" | "paused";

export default class GameState {
  private static instance: GameState;

  private state!: State;

  private constructor() {
    this.setState("ready");
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new GameState();
    }

    return this.instance;
  }

  setState(state: State) {
    this.state = state;
  }

  getState() {
    return this.state;
  }
}
