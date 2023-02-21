import * as THREE from "three";

const TEXTURE_RELATIVE_PATH = "src/assets/textures/block_atlas.png";
export const TILE_SIZE = 16;
export const TILE_TEXTURES_WIDTH = 128;
export const TILE_TEXTURE_HEIGHT = 128;

export default class TextureAtlas {
  private static instance: TextureAtlas;

  texture: THREE.Texture;

  private constructor() {
    this.texture = new THREE.TextureLoader().load(TEXTURE_RELATIVE_PATH);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
  }

  public static getInstance(): TextureAtlas {
    if (!this.instance) {
      this.instance = new TextureAtlas();
    }
    return this.instance;
  }
}
