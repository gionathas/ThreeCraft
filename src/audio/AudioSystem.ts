import { Audio, AudioListener, AudioLoader } from "three";
import * as soundSrcSet from "../assets/sounds";
import GameCamera from "../core/GameCamera";
import Logger from "../tools/Logger";

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

  private audioListener: AudioListener;
  private audioLoader: AudioLoader;

  private sounds: Map<string, Audio>;

  constructor(camera: GameCamera) {
    this.audioListener = camera.getAudioListener();
    this.audioLoader = new AudioLoader();

    this.sounds = this.loadSounds();
  }

  private loadSounds() {
    Logger.info("Loading sounds...", Logger.LOADING_KEY);

    const sounds = new Map();

    for (const src of Object.values(soundSrcSet)) {
      const filename = src.split("/").pop() as string;
      Logger.debug(`Loading sound: ${filename}`, Logger.LOADING_KEY);

      this.audioLoader.load(
        src,
        (buffer) => {
          const sound = new Audio(this.audioListener);
          sound.setBuffer(buffer);
          sound.setVolume(0);
          this.sounds.set(filename, sound);
        },
        undefined,
        (err) => Logger.error(err)
      );
    }

    Logger.info("Sound loaded!", Logger.LOADING_KEY);
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
    Logger.info("Disposing AudioSystem...", Logger.DISPOSE_KEY);
    this.sounds.clear();
  }
}
