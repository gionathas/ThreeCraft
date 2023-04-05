import { WebGLRenderer } from "three";

export default class Renderer extends WebGLRenderer {
  private static instance: Renderer;

  private constructor() {
    super();
  }

  static getInstance() {
    if (!this.instance) {
      throw new Error("Renderer not initialized");
    }

    return this.instance;
  }

  static create() {
    if (this.instance) {
      return this.instance;
    }

    const renderer = new Renderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // do not show the canvas until the game starts
    renderer.hideCanvas();

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.instance = renderer;
    return this.instance;
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
