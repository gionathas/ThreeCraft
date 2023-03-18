import { UIComponent } from "./UIComponent";

export default class CrossHair implements UIComponent {
  private crosshair: HTMLElement;

  constructor() {
    this.crosshair = this.initCrosshair();
  }

  private initCrosshair() {
    const crosshair = document.getElementById("crosshair")!;

    return crosshair;
  }

  show() {
    this.crosshair.style.display = "block";
  }

  hide() {
    this.crosshair.style.display = "none";
  }
}
