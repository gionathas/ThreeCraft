import AudioSystem from "./AudioSystem";

export abstract class SoundEffect {
  protected audioSystem: AudioSystem;
  protected soundIndex: number;

  constructor() {
    this.audioSystem = AudioSystem.getInstance();
    this.soundIndex = 0;
  }

  protected selectSoundFromSet(set: string[]) {
    const sound = set[this.soundIndex];
    this.soundIndex = (this.soundIndex + 1) % set.length;
    return sound;
  }
}
