import * as THREE from "three";

export default class Engine {
  public static readonly DEFAULT_FOV = 75;
  private static readonly Z_NEAR = 0.01;
  private static readonly Z_FAR = 1000;
  private static readonly MAX_FPS = 75;

  private static instance: Engine;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private constructor() {
    this.renderer = this.initRenderer();
    this.scene = this.initScene();
    this.camera = this.initCamera();
  }

  public static getInstance(): Engine {
    if (!this.instance) {
      this.instance = new Engine();
    }
    return this.instance;
  }

  private initRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // do not show the canvas until the game starts
    renderer.domElement.style.display = "none";

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return renderer;
  }

  private initScene() {
    return new THREE.Scene();
  }

  private initCamera() {
    const fov = Engine.DEFAULT_FOV;
    const near = Engine.Z_NEAR;
    const far = Engine.Z_FAR;
    const aspect = window.innerWidth / window.innerHeight;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    return camera;
  }

  start(update: (dt: number) => void) {
    this.renderer.domElement.style.display = "block";

    let previousTime = performance.now();

    // fixed timestep
    const timestep = 1 / Engine.MAX_FPS;
    let accumulator = 0;

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
    this.renderer.domElement.style.display = "none";

    this.renderer.setAnimationLoop(null);
    this.scene.clear();
    this.camera.clear();
    this.renderer.dispose();
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getTotalMeshes(): number {
    return this.scene.children.length;
  }

  setFov(fov: number) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }
}
