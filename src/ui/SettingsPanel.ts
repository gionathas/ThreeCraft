import Game from "../core/Game";
import SettingsManager, { Settings } from "../core/SettingsManager";

export default class SettingsPanel {
  private settingsManager: SettingsManager;

  private settingsPanel: HTMLElement;
  private backBtn: HTMLElement;
  private applyBtn: HTMLElement;

  // sliders
  private fovLabel: HTMLElement;
  private fovSlider: HTMLInputElement;
  private renderDistanceLabel: HTMLElement;
  private renderDistanceSlider: HTMLInputElement;

  constructor() {
    this.settingsManager = Game.instance().getSettingsManager();

    this.settingsPanel = document.getElementById("settings-panel")!;

    // buttons
    this.backBtn = this.settingsPanel.querySelector(".back-btn")!;
    this.applyBtn = this.settingsPanel.querySelector(".apply-btn")!;

    // fov slider
    this.fovLabel = this.settingsPanel.querySelector("#fov-label")!;
    this.fovSlider = this.settingsPanel.querySelector(
      "#fov-slider"
    ) as HTMLInputElement;
    this.refreshFov();

    // render distance slider
    this.renderDistanceLabel =
      this.settingsPanel.querySelector("#rdistance-label")!;
    this.renderDistanceSlider = this.settingsPanel.querySelector(
      "#rdistance-slider"
    ) as HTMLInputElement;
    this.refreshRenderDistance();

    this.initEventListeners();
  }

  private initEventListeners() {
    this.fovSlider.addEventListener("input", () => {
      const fov = parseInt(this.fovSlider.value);
      this.fovLabel.innerText = fov.toString();
    });

    this.renderDistanceSlider.addEventListener("input", () => {
      const renderDistance = parseInt(this.renderDistanceSlider.value);
      this.renderDistanceLabel.innerText = renderDistance.toString();
    });
  }

  onBack(callback: () => void) {
    this.backBtn.addEventListener("click", () => {
      this.refreshFov();
      this.refreshRenderDistance();
      callback();
    });
  }

  onApply(callback: (settings: Settings) => void) {
    this.applyBtn.addEventListener("click", async () => {
      const fov = parseInt(this.fovSlider.value);
      const renderDistance = parseInt(this.renderDistanceSlider.value);

      this.settingsManager.setFov(fov);
      this.refreshFov();

      this.settingsManager.setRenderDistance(renderDistance);
      this.refreshRenderDistance();

      await this.settingsManager.saveSettings();

      callback({
        fov,
        renderDistance,
      });
    });
  }

  show() {
    this.refreshFov();
    this.refreshRenderDistance();
    this.settingsPanel.style.display = "flex";
  }

  hide() {
    this.settingsPanel.style.display = "none";
  }

  private refreshFov() {
    const fov = this.settingsManager.getFov();

    this.fovSlider.value = fov.toString();
    this.fovLabel.innerText = fov.toString();
  }

  private refreshRenderDistance() {
    const renderDistance = this.settingsManager.getRenderDistance();

    this.renderDistanceSlider.value = renderDistance.toString();
    this.renderDistanceLabel.innerText = renderDistance.toString();
  }
}
