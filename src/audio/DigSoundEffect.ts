import { BlockMetadata } from "../terrain/block/Block";
import { SoundEffect } from "./SoundEffect";

export default class DigSoundEffect extends SoundEffect {
  constructor() {
    super();
  }

  playBlockPlacementSound(block: BlockMetadata) {
    const blockPlacementSoundSet = block.sounds?.dig;

    if (blockPlacementSoundSet) {
      const placeSound = this.selectSoundFromSet(blockPlacementSoundSet);
      this.audioSystem.playSound(placeSound);
    }
  }

  playBlockDestroySound(block: BlockMetadata) {
    const blockPlacementSoundSet = block.sounds?.dig;

    if (blockPlacementSoundSet) {
      const destroySound = this.selectSoundFromSet(blockPlacementSoundSet);
      this.audioSystem.playSound(destroySound);
    }
  }
}
