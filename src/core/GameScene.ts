import { AmbientLight, Color, DirectionalLight, Fog, Scene } from "three";
import EnvVars from "../config/EnvVars";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import { GameData } from "../io/DataManager";
import { Chunk } from "../terrain/chunk";
import DebugControls from "../tools/DebugControls";
import Logger from "../tools/Logger";
import UI from "../ui/UI";
import GameCamera from "./GameCamera";
import GameState from "./GameState";
import { Settings } from "./SettingsManager";

/**
 * //TODO Implement ECS pattern
 */
export default class GameScene extends Scene {
  private static readonly SkyColor: string = "#87CEEB";

  private initialized: boolean;
  private gui!: DebugControls;

  private lights: THREE.Light[];

  private gameState: GameState;
  private camera: GameCamera;

  // entities
  private player: Player | null;
  private terrain: Terrain | null;
  private ui: UI | null;

  constructor(state: GameState, camera: GameCamera) {
    super();
    this.initialized = false;

    this.gameState = state;
    this.camera = camera;

    this.lights = [];
    this.player = null;
    this.terrain = null;
    this.ui = null;
  }

  async init(gameData: GameData, settings: Settings, asyncInit: boolean) {
    if (this.initialized) {
      throw new Error("Game scene already initialized!");
    }

    Logger.info("Initializing scene...", Logger.SCENE_KEY);
    this.gui = DebugControls.getInstance();
    this.lights = this.initLights();
    this.initBackground();
    this.initFog(settings.renderDistance);
    this.camera.setFov(settings.fov);

    await this.initEntities(gameData, settings, asyncInit);

    this.initialized = true;
    Logger.info("Scene initialized", Logger.SCENE_KEY);
  }

  start() {
    if (!this.initialized) {
      throw new Error("Game scene not initialized!");
    }

    this.player!.lockControls();
  }

  update(dt: number) {
    const { player, terrain, ui } = this;

    if (this.gameState.isRunning()) {
      terrain!.update(player!.getPosition());
      player!.update(dt);
      ui!.update();
    }
  }

  /**
   * //TODO implement a better light system (smooth lighting)
   */
  private initLights() {
    const sunLight = new DirectionalLight(0xffffff, 0.2);
    sunLight.position.set(100, 100, 0);

    // const helper = new THREE.DirectionalLightHelper(sunLight, 5);

    const ambientLight = new AmbientLight(0xffffff, 0.8);

    // add lights
    this.add(sunLight, ambientLight);
    // this.scene.add(helper);

    return [sunLight, ambientLight];
  }

  private initBackground() {
    // set sky color
    this.background = new Color(GameScene.SkyColor);
  }

  /**
   * This will apply a fog fading effect
   * starting from one chunk before the rendering distance
   */
  private initFog(renderingDistanceInChunks: number) {
    if (!EnvVars.FOG_ENABLED) {
      return;
    }

    const renderingDistance = renderingDistanceInChunks * Chunk.WIDTH;
    const far = renderingDistance - Chunk.WIDTH;
    // not a too intrusive fog fading effect, just 2 blocks long
    const near = far - 2;

    this.fog = new Fog(GameScene.SkyColor, near, far);
  }

  private async initEntities(
    gameData: GameData,
    settings: Settings,
    asyncInit: boolean
  ) {
    // init game entities
    Logger.info("Initializing game entities...", Logger.INIT_KEY);
    this.terrain = asyncInit
      ? await this.asyncInitTerrain(gameData, settings)
      : this.initTerrain(gameData, settings);

    this.player = this.initPlayer(this.terrain, gameData);
    this.ui = this.initUI(this.player, this.terrain);
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
    Logger.info("Disposing scene...", Logger.DISPOSE_KEY, Logger.SCENE_KEY);

    // disposing lights
    this.lights.forEach((light) => light.dispose());
    this.lights = [];

    // disposing entities
    this.disposeEntities();

    // clear scene
    this.clear();
    this.initialized = false;
  }

  private disposeEntities() {
    // entities disposing
    Logger.info(
      "Disposing game entities...",
      Logger.GAME_LOOP_KEY,
      Logger.DISPOSE_KEY
    );
    this.terrain?.dispose();
    this.player?.dispose();
    this.ui?.dispose();

    this.player = null;
    this.terrain = null;
    this.ui = null;
  }

  getMeshCount(): number {
    return this.children.length;
  }
}
