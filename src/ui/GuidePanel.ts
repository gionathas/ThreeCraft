import KeyBindings from "../config/KeyBindings";

export default class GuidePanel {
  private guidePanel: HTMLElement;
  private backBtn: HTMLElement;
  private guideContent: HTMLElement;

  constructor() {
    this.guidePanel = document.getElementById("guide-panel")!;
    this.backBtn = this.guidePanel.querySelector(".back-btn")!;
    this.guideContent = this.guidePanel.querySelector("#guide-content")!;

    this.guideContent.innerHTML = `
    <b>Left Click</b>: Erase Block / Select Item <br />
    <b>Right Click</b>: Place Block / Split Item <br />
    <b>Wheel / Number Keys</b>: Select Hotbar Item <br />
    <b>Move</b>: WASD keys <br />
    <b>Jump / Fly Up</b>: ${this.prettyPrintKey(KeyBindings.JUMP_KEY)} <br />
    <b>Sprint / Fly Down</b>: ${this.prettyPrintKey(
      KeyBindings.SPRINT_KEY
    )} <br />
    <b>Open/Close Inventory</b>: ${this.prettyPrintKey(
      KeyBindings.TOGGLE_INVENTORY_KEY
    )} <br />
    <b>Show Debug Info</b>: ${this.prettyPrintKey(
      KeyBindings.TOGGLE_DEBUG_INFO_KEY
    )} <br />
    `;
  }

  show() {
    this.guidePanel.style.display = "flex";
  }

  hide() {
    this.guidePanel.style.display = "none";
  }

  private prettyPrintKey(key: string) {
    if (key.includes("Key")) return key.replace("Key", "");

    return key;
  }

  onBack(callback: () => void) {
    this.backBtn.addEventListener("click", callback);
  }
}
