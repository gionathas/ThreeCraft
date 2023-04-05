import { WebGLRenderer } from "three";
import GameCamera from "./GameCamera";
import GameScene from "./GameScene";
import Logger from "./Logger";
import { Settings } from "./SettingsManager";

export default class Engine {
  // NOTE FPS are capped at 75, maybe make this configurable in the future
  private static readonly MAX_FPS = 75;

  private static instance: Engine;

  private renderer: THREE.WebGLRenderer;
  private scene: GameScene;
  private camera: GameCamera;

  private constructor() {
    this.renderer = this.initRenderer();
    this.scene = GameScene.getInstance();
    this.camera = GameCamera.getInstance();
  }

  public static getInstance(): Engine {
    if (!this.instance) {
      this.instance = new Engine();
    }
    return this.instance;
  }

  private initRenderer() {
    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // do not show the canvas until the game starts
    renderer.domElement.style.display = "none";

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return renderer;
  }

  start(settings: Settings, update: (dt: number) => void) {
    Logger.info("Starting engine...", Logger.ENGINE_KEY);

    this.scene.init(settings);
    this.showCanvas();

    let previousTime = performance.now();

    // fixed timestep
    const timestep = 1 / Engine.MAX_FPS;
    let accumulator = 0;

    // start game loop
    this.renderer.setAnimationLoop((time) => {
      let dt = (time - previousTime) / 1000;
      previousTime = time;

      // Track the accumulated time that hasn't been simulated yet
      accumulator += dt;

      // Simulate the total elapsed time in fixed-size chunks
      let numUpdateSteps = 0;
      while (accumulator >= timestep) {
        update(timestep);
        accumulator -= timestep;

        // Prevent spiral of death
        if (++numUpdateSteps >= 240) {
          console.warn("Too many update steps");
          // discard the unsimulated time
          accumulator = 0;
          break;
        }
      }

      this.renderer.render(this.scene, this.camera);
    });
  }

  dispose() {
    Logger.info("Disposing engine...", Logger.DISPOSE_KEY, Logger.ENGINE_KEY);

    this.hideCanvas();

    this.renderer.setAnimationLoop(null);
    this.scene.dispose();
    this.camera.clear();
    this.renderer.dispose();

    Logger.info("Engine disposed", Logger.DISPOSE_KEY, Logger.ENGINE_KEY);
  }

  private showCanvas() {
    this.renderer.domElement.style.display = "block";
  }

  private hideCanvas() {
    this.renderer.domElement.style.display = "none";
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}
