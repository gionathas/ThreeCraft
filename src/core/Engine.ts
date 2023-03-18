import * as THREE from "three";
import EnvVars from "../config/EnvVars";

export default class Engine {
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

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return renderer;
  }

  private initScene() {
    return new THREE.Scene();
  }

  private initCamera() {
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 1000;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    return camera;
  }

  start(update: (dt: number) => void) {
    let previousTime = performance.now();
    this.renderer.setAnimationLoop((time) => {
      let dt = (time - previousTime) * 0.001;

      if (dt > EnvVars.TARGET_FRAME_RATE || dt < 0) {
        dt = EnvVars.TARGET_FRAME_RATE;
      }

      update(dt);

      this.renderer.render(this.scene, this.camera);

      previousTime = time;
    });
  }

  stop() {
    //TODO clear scene
    this.renderer.setAnimationLoop(null);
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
}
