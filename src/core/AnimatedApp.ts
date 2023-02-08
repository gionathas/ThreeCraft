import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { TARGET_FRAME_RATE } from "../config/constants";

export type Config = {
  sceneConfig: {
    background?: THREE.Texture | THREE.Color | null;
    meshes?: THREE.Mesh[];
  };
  lightsConfig: {
    lights: THREE.Light[];
  };
  statsConfig?: {
    fps?: boolean;
    memory?: boolean;
  };
  guiConfig?: {
    grid?: boolean;
    axes?: boolean;
  };
  cameraConfig?: {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
    position?: THREE.Vector3;
    lookAt?: THREE.Vector3;
  };
  orbitControls?: {
    target?: THREE.Vector3;
  };
  textureConfig?: {
    url: string;
    magFilter: THREE.TextureFilter;
    minFilter: THREE.TextureFilter;
  };
};

export default class AnimatedApp {
  protected config: Config;
  renderer!: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene;
  texture?: THREE.Texture;

  GUI!: GUI;
  statsFPS!: Stats;
  statsMemory!: Stats;

  constructor(config: Config) {
    this.config = config;
    this.setupRenderer();
    this.setupStats();
    // this.setupTextures();
    this.setupCamera();
    this.setupControls();
    this.setupScene();
    this.setupLights();
    this.setupGUI();
  }

  render(update: (dt: number) => void) {
    let previousTime = performance.now();
    this.renderer.setAnimationLoop((time) => {
      let dt = (time - previousTime) * 0.001;

      if (dt > TARGET_FRAME_RATE || dt < 0) {
        dt = TARGET_FRAME_RATE;
      }

      update(dt);

      this.renderer.render(this.scene, this.camera);

      if (this.statsFPS) {
        this.statsFPS.update();
      }

      if (this.statsMemory) {
        this.statsMemory.update();
      }

      previousTime = time;
    });
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }

  setupStats() {
    const { statsConfig = {} } = this.config;
    const { fps = true, memory = true } = statsConfig;

    if (fps) {
      this.statsFPS = Stats();
      this.statsFPS.showPanel(0);
      this.statsFPS.dom.style.cssText = "position:absolute;top:0px;left:0px;"; // set position
      document.body.appendChild(this.statsFPS.dom);
    }

    if (memory) {
      this.statsMemory = Stats();
      this.statsMemory.showPanel(2);
      this.statsMemory.dom.style.cssText =
        "position:absolute;top:50px;left:0px;"; // set position
      document.body.appendChild(this.statsMemory.dom);
    }
  }

  setupCamera() {
    const { cameraConfig = {} } = this.config;
    const {
      fov = 75,
      aspect = window.innerWidth / window.innerHeight,
      near = 0.001,
      far = 1000,
      position = new THREE.Vector3(10, 10, 10),
      lookAt = new THREE.Vector3(0, 0, 0),
    } = cameraConfig;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.copy(position);
    this.camera.lookAt(lookAt);
  }

  setupControls() {
    const { orbitControls: controlsConfig } = this.config;
    if (!controlsConfig) return;

    const { target = new THREE.Vector3(0, 0, 0) } = controlsConfig;

    const orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    orbitControls.target.copy(target);
    orbitControls.update();
  }

  // setupTextures() {
  //   const { textureConfig } = this.config;

  //   if (textureConfig) {
  //     this.texture = new THREE.TextureLoader().load(textureConfig.url);
  //     this.texture.magFilter = textureConfig.magFilter;
  //     this.texture.minFilter = textureConfig.minFilter;
  //   }
  // }

  setupScene() {
    const { sceneConfig } = this.config;
    this.scene = new THREE.Scene();

    if (sceneConfig?.background) {
      this.scene.background = sceneConfig.background;
    }

    if (sceneConfig.meshes) {
      this.scene.add(...sceneConfig.meshes);
    }
  }

  setupLights() {
    const {
      lightsConfig: { lights },
    } = this.config;
    this.scene.add(...lights);
  }

  setupGUI() {
    const { guiConfig = {} } = this.config;
    const { axes = true, grid = true } = guiConfig;

    this.GUI = new GUI();

    if (grid) {
      const gridHelper = new THREE.GridHelper();
      this.scene.add(gridHelper);
    }

    if (axes) {
      const axesHelper = new THREE.AxesHelper();
      this.scene.add(axesHelper);
    }
  }
}
