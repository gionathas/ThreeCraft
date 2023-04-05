import { AudioListener, PerspectiveCamera } from "three";

export default class GameCamera extends PerspectiveCamera {
  public static readonly DEFAULT_FOV = 75;
  private static readonly Z_NEAR = 0.01;
  private static readonly Z_FAR = 1000;

  private static instance: GameCamera | null;

  private onResizeRef: () => void;

  private audioListener: AudioListener;

  private constructor() {
    super(
      GameCamera.DEFAULT_FOV,
      GameCamera.getAspectRatio(),
      GameCamera.Z_NEAR,
      GameCamera.Z_FAR
    );

    this.audioListener = this.initAudioListener();

    // listeners
    this.onResizeRef = this.onResize.bind(this);
    window.addEventListener("resize", this.onResizeRef);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new GameCamera();
    }
    return this.instance;
  }

  private initAudioListener() {
    const audioListener = new AudioListener();
    this.add(audioListener);

    return audioListener;
  }

  private static getAspectRatio() {
    return window.innerWidth / window.innerHeight;
  }

  setFov(fov: number) {
    this.fov = fov;
    this.updateProjectionMatrix();
  }

  getAudioListener() {
    return this.audioListener;
  }

  private onResize() {
    this.aspect = GameCamera.getAspectRatio();
    this.updateProjectionMatrix();
  }
}
