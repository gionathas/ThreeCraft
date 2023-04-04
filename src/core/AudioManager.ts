import { Audio, AudioListener, AudioLoader } from "three";
import GameCamera from "./GameCamera";
import Logger from "./Logger";

const srcSet = import.meta.glob("/src/assets/sounds/*.ogg");

export default class AudioManager {
  private static instance: AudioManager | null;

  private audioListener: AudioListener;
  private audioLoader: AudioLoader;

  private sounds: Map<string, Audio>;
  private index: number;

  private constructor() {
    this.audioListener = GameCamera.getInstance().getAudioListener();
    this.audioLoader = new AudioLoader();

    this.index = 0;
    this.sounds = this.loadSounds();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  private loadSounds() {
    Logger.debug("Loading sounds...");

    const sounds = new Map();

    for (const src of Object.keys(srcSet)) {
      debugger;
      const filename = src.split("/").pop() as string;

      this.audioLoader.load(
        src,
        (buffer) => {
          const sound = new Audio(this.audioListener);
          sound.setBuffer(buffer);
          sound.setVolume(0.15);
          this.sounds.set(filename, sound);
        },
        undefined,
        (err) => console.error(err)
      );
    }

    Logger.debug("Sounds loaded");
    return sounds;
  }

  playSoundFromSet(set: string[]) {
    this.index %= set.length;

    const sound = this.sounds.get(set[this.index]);

    if (sound) {
      sound.play();
      this.index += 1;
    }
  }

  playSound(name: string) {
    this.sounds.get(name)?.play();
  }

  dispose() {
    this.sounds.clear();
    AudioManager.instance = null;
  }
}
