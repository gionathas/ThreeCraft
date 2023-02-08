import * as THREE from "three";

// const TEXTURE_RELATIVE_PATH = "src/assets/textures/flourish.png";
const TEXTURE_RELATIVE_PATH = "src/assets/textures/block_atlas.png";
export const TILE_SIZE = 16;
export const TILE_TEXTURES_WIDTH = 128;
export const TILE_TEXTURE_HEIGHT = 128;

export default class TextureManager {
  private static instance: TextureManager;

  texture: THREE.Texture;

  private constructor() {
    this.texture = new THREE.TextureLoader().load(TEXTURE_RELATIVE_PATH);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
  }

  public static getInstance(): TextureManager {
    if (!this.instance) {
      this.instance = new TextureManager();
    }
    return this.instance;
  }
}
