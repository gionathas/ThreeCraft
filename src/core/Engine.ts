import * as THREE from "three";
import EnvVars from "../config/EnvVars";

export default class Engine {
  private static instance: Engine;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  private constructor() {
    this.initRenderer();
    this.initScene();
    this.initCamera();
  }

  public static getInstance(): Engine {
    if (!this.instance) {
      this.instance = new Engine();
    }
    return this.instance;
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private initScene() {
    this.scene = new THREE.Scene();
  }

  private initCamera() {
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 1000;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
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
