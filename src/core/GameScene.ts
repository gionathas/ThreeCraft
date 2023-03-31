import { AmbientLight, Color, DirectionalLight, Scene } from "three";

export default class GameScene extends Scene {
  private static instance: GameScene | null;

  private static readonly SkyColor: string = "#87CEEB";

  private initialized: boolean;

  private lights: THREE.Light[];

  private constructor() {
    super();
    this.initialized = false;
    this.lights = [];
  }

  public static getInstance(): GameScene {
    if (!this.instance) {
      this.instance = new GameScene();
    }
    return this.instance;
  }

  init() {
    if (this.initialized) {
      return;
    }

    this.lights = this.initLights();
    this.initBackground();

    this.initialized = true;
  }

  /**
   * //TODO implement a better light system (smooth lighting)
   */
  private initLights() {
    const sunLight = new DirectionalLight(0xffffff, 0.2);
    sunLight.position.set(100, 100, 0);

    // const helper = new THREE.DirectionalLightHelper(sunLight, 5);

    const ambientLight = new AmbientLight(0xffffff, 0.8);

    // add lights
    this.add(sunLight, ambientLight);
    // this.scene.add(helper);

    return [sunLight, ambientLight];
  }

  private initBackground() {
    // set sky color
    this.background = new Color(GameScene.SkyColor);
  }

  dispose() {
    this.lights.forEach((light) => light.dispose());
    this.lights = [];
    this.clear();

    this.initialized = false;
  }

  getMeshCount(): number {
    return this.children.length;
  }
}
