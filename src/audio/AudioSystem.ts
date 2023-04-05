import { Audio, AudioListener, AudioLoader } from "three";
import * as soundSrcSet from "../assets/sounds";
import GameCamera from "../core/GameCamera";
import Logger from "../core/Logger";

export enum VolumeLevel {
  VERY_LOW = 0.02,
  NORMAL = 0.1,
}

export enum PlaybackRate {
  NORMAL = 1,
  FAST = 1.2,
}
export default class AudioSystem {
  private static readonly DEFAULT_VOLUME = VolumeLevel.NORMAL;
  private static readonly DEFAULT_PLAYBACK_RATE = PlaybackRate.NORMAL;

  private static instance: AudioSystem | null;

  private audioListener: AudioListener;
  private audioLoader: AudioLoader;

  private sounds: Map<string, Audio>;

  private constructor() {
    this.audioListener = GameCamera.getInstance().getAudioListener();
    this.audioLoader = new AudioLoader();

    this.sounds = this.loadSounds();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new AudioSystem();
    }
    return this.instance;
  }

  private loadSounds() {
    Logger.debug("Loading sounds...");

    const sounds = new Map();

    for (const src of Object.values(soundSrcSet)) {
      Logger.debug(`Loading sound: ${src}`);
      const filename = src.split("/").pop() as string;

      this.audioLoader.load(
        src,
        (buffer) => {
          const sound = new Audio(this.audioListener);
          sound.setBuffer(buffer);
          sound.setVolume(0);
          this.sounds.set(filename, sound);
        },
        undefined,
        (err) => console.error(err)
      );
    }

    Logger.debug("Sounds loaded");
    return sounds;
  }

  playSound(
    soundFile: string,
    options?: { volume?: VolumeLevel; playbackRate?: PlaybackRate }
  ) {
    const volume = options?.volume ?? AudioSystem.DEFAULT_VOLUME;
    const pbRate = options?.playbackRate ?? AudioSystem.DEFAULT_PLAYBACK_RATE;

    const sound = this.sounds.get(soundFile);

    if (sound) {
      sound.setVolume(volume);
      sound.setPlaybackRate(pbRate);
      sound.play();
    }
  }

  dispose() {
    Logger.debug("Disposing AudioSystem...");
    this.sounds.clear();
    AudioSystem.instance = null;
  }
}
