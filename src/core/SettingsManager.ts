import EnvVars from "../config/EnvVars";
import DataManager from "../io/DataManager";
import GameCamera from "./GameCamera";

export type Settings = {
  fov: number;
  renderDistance: number;
};

export default class SettingsManager {
  static readonly DEFAULT_FOV = GameCamera.DEFAULT_FOV;
  static readonly DEFAULT_RENDER_DISTANCE_IN_CHUNKS =
    EnvVars.DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS;

  private dataManager: DataManager;
  private settings: Settings;

  constructor(dataManager: DataManager) {
    this.dataManager = dataManager;
    this.settings = {
      fov: SettingsManager.DEFAULT_FOV,
      renderDistance: SettingsManager.DEFAULT_RENDER_DISTANCE_IN_CHUNKS,
    };
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

  async loadSettings() {
    const settings = await this.dataManager.getSettingsData();

    if (settings) {
      this.settings = settings;
    }
  }
}
