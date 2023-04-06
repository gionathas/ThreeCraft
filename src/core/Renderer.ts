import { WebGLRenderer } from "three";

export default class Renderer extends WebGLRenderer {
  constructor() {
    super();
    this.init();
  }

  private init() {
    this.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.domElement);

    // do not show the canvas until the game starts
    this.hideCanvas();

    window.addEventListener("resize", () => {
      this.setSize(window.innerWidth, window.innerHeight);
    });
  }

  showCanvas() {
    this.domElement.style.display = "block";
  }

  hideCanvas() {
    this.domElement.style.display = "none";
  }

  getCanvas(): HTMLCanvasElement {
    return this.domElement;
  }
}
