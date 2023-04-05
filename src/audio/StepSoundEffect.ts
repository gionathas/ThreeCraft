import { BlockData } from "../terrain/block";
import { PlaybackRate, VolumeLevel } from "./AudioSystem";
import { SoundEffect } from "./SoundEffect";

export default class StepSoundEffect extends SoundEffect {
  static readonly WALKING_STEP_DELAY_MS = 500;
  static readonly RUNNING_STEP_DELAY_MS = 350;

  // state
  private lastStepTime: number;

  constructor() {
    super();
    this.lastStepTime = 0;
  }

  playStepSound(block: BlockData, isRunning: boolean) {
    const { lastStepTime } = this;
    const currentTime = performance.now();

    const delay = isRunning
      ? StepSoundEffect.RUNNING_STEP_DELAY_MS
      : StepSoundEffect.WALKING_STEP_DELAY_MS;

    const volume = VolumeLevel.VERY_LOW;
    const playbackRate = isRunning ? PlaybackRate.FAST : PlaybackRate.NORMAL;
    const blockStepSoundsSet = block.sounds?.hit;

    // no sounds for this block
    if (!blockStepSoundsSet) {
      return;
    }

    // play a new step sound when the delay has passed
    if (currentTime - lastStepTime >= delay) {
      const stepSound = this.selectSoundFromSet(blockStepSoundsSet);
      this.audioSystem.playSound(stepSound, {
        volume,
        playbackRate,
      });
      this.lastStepTime = currentTime;
    }
  }
}
