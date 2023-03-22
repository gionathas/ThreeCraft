import * as THREE from "three";

const TEXTURE_RELATIVE_PATH = "src/assets/textures/block_atlas.png";
export const TILE_SIZE = 16;
export const TILE_TEXTURES_WIDTH = 128;
export const TILE_TEXTURE_HEIGHT = 128;
export default class BlockMaterial {
  private static instance: BlockMaterial | null;

  private blockTexture: THREE.Texture;
  private blockSolidMaterial: THREE.MeshStandardMaterial;
  private blockTransparentMaterial: THREE.MeshStandardMaterial;

  private constructor() {
    this.blockTexture = this.initTextureAtlas();
    this.blockSolidMaterial = this.initBlockSolidMaterial();
    this.blockTransparentMaterial = this.initBlockTransparentMaterial();
  }

  public static getInstance(): BlockMaterial {
    if (!this.instance) {
      this.instance = new BlockMaterial();
    }
    return this.instance;
  }

  private initTextureAtlas() {
    const texture = new THREE.TextureLoader().load(TEXTURE_RELATIVE_PATH);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    return texture;
  }

  private initBlockSolidMaterial() {
    return new THREE.MeshStandardMaterial({
      map: this.blockTexture,
      side: THREE.FrontSide,
      vertexColors: true,
    });
  }

  /**
   * //NOTE might now work well with water since is only front sided
   * so if you look up under water you won't see anything
   *
   * A potential solution could be using a custom shader or a specific material for water
   */
  private initBlockTransparentMaterial() {
    return new THREE.MeshStandardMaterial({
      map: this.blockTexture,
      side: THREE.FrontSide,
      alphaTest: 0.1,
      transparent: true,
    });
  }

  dispose() {
    this.blockTexture.dispose();
    this.blockSolidMaterial.dispose();
    this.blockTransparentMaterial.dispose();
    BlockMaterial.instance = null;
  }

  getBlockSolidMaterial() {
    return this.blockSolidMaterial;
  }

  getBlockTransparentMaterial() {
    return this.blockTransparentMaterial;
  }
}
