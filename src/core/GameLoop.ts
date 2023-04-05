import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { InventoryState } from "../player/InventoryManager";
import UI from "../ui/UI";
import Engine from "./Engine";
import GameState from "./GameState";
import Logger from "./Logger";
import { Settings } from "./SettingsManager";

export type GameData = {
  world: {
    seed: string;
  };
  player: {
    spawnPosition: THREE.Vector3;
    quaternion: THREE.Quaternion;
    inventory: InventoryState;
  };
};

export default class GameLoop {
  private engine: Engine;

  private gameState: GameState;
  private inputController: InputController;

  private player: Player | null;
  private terrain: Terrain | null;
  private ui: UI | null;

  constructor() {
    this.engine = Engine.getInstance();
    this.gameState = GameState.getInstance();
    this.inputController = InputController.getInstance();

    this.player = null;
    this.terrain = null;
    this.ui = null;
  }

  async start(gameData: GameData, settings: Settings, asyncStart: boolean) {
    this.gameState.setState("loading");

    // init game entities
    Logger.info("Initializing game entities...", Logger.GAME_LOOP_KEY);
    this.terrain = asyncStart
      ? await this.asyncInitTerrain(gameData, settings)
      : this.initTerrain(gameData, settings);
    this.player = this.initPlayer(this.terrain, gameData);
    this.ui = this.initUI(this.player, this.terrain);
    Logger.info("Game Entities initialized", Logger.GAME_LOOP_KEY);

    this.gameState.setState("running");

    // enable player controls
    this.player.enableControls();

    // start game loop
    this.engine.start(settings, this.update.bind(this));
  }

  private update(dt: number) {
    const { inputController, player, terrain, ui } = this;

    if (this.gameState.isRunning()) {
      terrain!.update(player!.getPosition());
      player!.update(dt);
      ui!.update();
      inputController.update(); // this must come lastly
    }
  }

  private async asyncInitTerrain(gameData: GameData, settings: Settings) {
    if (this.terrain) {
      return this.terrain;
    }

    const { spawnPosition } = gameData.player;
    const { seed } = gameData.world;
    const { renderDistance } = settings;

    const terrain = new Terrain(seed, renderDistance);
    await terrain.asyncInit(spawnPosition);

    return terrain;
  }

  private initTerrain(gameData: GameData, settings: Settings) {
    if (this.terrain) {
      return this.terrain;
    }

    const { spawnPosition } = gameData.player;
    const { seed } = gameData.world;
    const { renderDistance } = settings;

    const terrain = new Terrain(seed, renderDistance);
    terrain.init(spawnPosition);

    return terrain;
  }

  private initPlayer(terrain: Terrain, gameData: GameData) {
    if (this.player) {
      return this.player;
    }

    const { spawnPosition: spawn, quaternion, inventory } = gameData.player;

    const player = new Player(terrain, inventory);
    player.setSpawnPosition(spawn.x, spawn.y, spawn.z);
    player.setQuaternion(quaternion);

    return player;
  }

  private initUI(player: Player, terrain: Terrain) {
    const ui = new UI(player, terrain);

    return ui;
  }

  dispose() {
    Logger.info(
      "Disposing game loop...",
      Logger.GAME_LOOP_KEY,
      Logger.DISPOSE_KEY
    );
    // entities disposing
    this.inputController.disable();
    this.terrain?.dispose();
    this.player?.dispose();
    this.ui?.dispose();
    this.engine.dispose();

    this.player = null;
    this.terrain = null;
    this.ui = null;

    Logger.info("Game Loop disposed", Logger.GAME_LOOP_KEY, Logger.DISPOSE_KEY);
  }
}
