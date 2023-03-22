import { Settings } from "../core/SettingsManager";
import SettingsPanel from "./SettingsPanel";

type MenuLayout = "main" | "loading" | "settings" | "guide";
export default class MainMenu {
  private layout!: MenuLayout;
  private mainMenu: HTMLElement;

  private githubIcon: HTMLElement;
  private overlay: HTMLElement;

  // labels
  private title: HTMLElement;
  private loadingLabel: HTMLElement;

  // buttons
  private playBtn: HTMLElement;
  private resetBtn: HTMLElement;
  private settingsBtn: HTMLElement;
  private guideBtn: HTMLElement;

  // panels
  private guidePanel: HTMLElement;
  private settingsPanel: SettingsPanel;

  constructor() {
    this.mainMenu = document.getElementById("main-menu")!;
    this.overlay = document.getElementById("overlay")!;
    this.githubIcon = document.getElementById("github-link-icon")!;

    // labels
    this.title = this.mainMenu.querySelector(".title")!;
    this.loadingLabel = this.mainMenu.querySelector(".loading-label")!;

    // main menu buttons
    this.playBtn = document.getElementById("play-btn")!;
    this.resetBtn = document.getElementById("reset-btn")!;
    this.settingsBtn = document.getElementById("options-btn")!;
    this.guideBtn = document.getElementById("guide-btn")!;

    // settings panel
    this.settingsPanel = new SettingsPanel();

    //panels
    this.guidePanel = document.getElementById("guide-panel")!;

    // set initial screen
    this.setMenuLayout("main");
  }

  show() {
    this.mainMenu.style.display = "block";
    this.overlay.style.display = "block";
    this.githubIcon.style.display = "block";
  }

  hide() {
    this.mainMenu.style.display = "none";
    this.overlay.style.display = "none";
    this.githubIcon.style.display = "none";
  }

  setMenuLayout(layout: MenuLayout) {
    this.removeLayout();

    switch (layout) {
      case "main":
        this.layout = "main";
        this.showMainLayout();
        break;
      case "loading":
        this.layout = "loading";
        this.showLoadingLayout();
        break;
      case "settings":
        this.layout = "settings";
        this.showSettingsLayout();
        break;
      case "guide":
        this.layout = "guide";
        this.showGuideLayout();
        break;
    }
  }

  private removeLayout() {
    switch (this.layout) {
      case "main":
        this.hideMainLayout();
        break;
      case "loading":
        this.hideLoadingLayout();
        break;
      case "settings":
        this.hideOptionsLayout();
        break;
      case "guide":
        this.hideGuideLayout();
        break;
    }
  }

  private hideMainLayout() {
    this.playBtn.style.display = "none";
    this.resetBtn.style.display = "none";
    this.settingsBtn.style.display = "none";
    this.guideBtn.style.display = "none";
  }

  private hideLoadingLayout() {
    this.title.style.display = "block";
    this.loadingLabel.style.display = "none";
  }

  private hideOptionsLayout() {
    this.title.style.display = "block";
    this.settingsPanel.hide();
  }

  private hideGuideLayout() {
    this.title.style.display = "block";
    this.guidePanel.style.display = "none";
  }

  private showMainLayout() {
    this.title.style.display = "block";

    // buttons
    this.playBtn.style.display = "block";
    this.resetBtn.style.display = "block";
    this.settingsBtn.style.display = "block";
    this.guideBtn.style.display = "block";
  }

  private showLoadingLayout() {
    this.title.style.display = "none";
    this.loadingLabel.style.display = "block";
  }

  private showSettingsLayout() {
    this.title.style.display = "none";
    this.settingsPanel.show();
  }

  private showGuideLayout() {
    this.title.style.display = "none";
    this.guidePanel.style.display = "flex";
  }

  onPlayWorld(callback: () => void) {
    this.playBtn.addEventListener("click", callback);
  }

  onResetWorld(callback: () => void) {
    this.resetBtn.addEventListener("click", callback);
  }

  onSettings(callback: () => void) {
    this.settingsBtn.addEventListener("click", callback);
  }

  onSettingsApply(callback: (settings: Settings) => void) {
    this.settingsPanel.onApply(callback);
  }

  onGuide(callback: () => void) {
    this.guideBtn.addEventListener("click", callback);
  }

  onBack(callback: () => void) {
    this.settingsPanel.onBack(callback);
  }
}
