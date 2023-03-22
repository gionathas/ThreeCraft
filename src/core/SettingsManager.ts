import EnvVars from "../config/EnvVars";
import GameDataManager from "../io/GameDataManager";
import Engine from "./Engine";

export type Settings = {
  fov: number;
  renderDistance: number;
};

export default class SettingsManager {
  private static instance: SettingsManager;

  static readonly DEFAULT_FOV = Engine.DEFAULT_FOV;
  static readonly DEFAULT_RENDER_DISTANCE_IN_CHUNKS =
    EnvVars.DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS;

  private dataManager: GameDataManager;

  private settings: Settings;

  private constructor(settings: Settings) {
    this.dataManager = GameDataManager.getInstance();

    this.settings = settings;
  }

  static getInstance(): SettingsManager {
    if (!this.instance) {
      this.instance = new SettingsManager({
        fov: SettingsManager.DEFAULT_FOV,
        renderDistance: SettingsManager.DEFAULT_RENDER_DISTANCE_IN_CHUNKS,
      });
    }
    return this.instance;
  }

  getSettings() {
    return this.settings;
  }

  getFov() {
    return this.settings.fov;
  }

  setFov(fov: number) {
    this.settings.fov = fov;
  }

  getRenderDistance() {
    return this.settings.renderDistance;
  }

  setRenderDistance(renderDistanceInChunks: number) {
    this.settings.renderDistance = renderDistanceInChunks;
  }

  async saveSettings() {
    await this.dataManager.saveSettingsData(this.settings);
  }

  async loadSavedSettings() {
    const settings = await this.dataManager.getSettingsData();

    if (settings) {
      this.settings = settings;
    }
  }
}
