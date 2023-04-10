import {
  FrontSide,
  MeshStandardMaterial,
  NearestFilter,
  TextureLoader,
} from "three";
import blockAtlasUrl from "../../assets/textures/block_atlas.png?url";
import Logger from "../../tools/Logger";

const TEXTURE_ATLAS_PATH = blockAtlasUrl;
export const TEXTURE_TILE_SIZE = 16;
export const TEXTURE_TILE_WIDTH = 128;
export const TEXTURE_TILE_HEIGHT = 128;
export default class BlockMaterial {
  private static instance: BlockMaterial | null;
  private textureAtlas: THREE.Texture;

  // materials
  private blockSolidMaterial: THREE.MeshStandardMaterial;
  private blockTransparentMaterial: THREE.MeshStandardMaterial;

  private constructor() {
    this.textureAtlas = this.loadTextureAtlas();
    this.blockSolidMaterial = this.createBlockSolidMaterial();
    this.blockTransparentMaterial = this.createBlockTransparentMaterial();
  }

  public static getInstance(): BlockMaterial {
    if (!this.instance) {
      this.instance = new BlockMaterial();
    }
    return this.instance;
  }

  private loadTextureAtlas() {
    const texture = new TextureLoader().load(TEXTURE_ATLAS_PATH);
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;

    return texture;
  }

  private createBlockSolidMaterial() {
    return new MeshStandardMaterial({
      map: this.textureAtlas,
      side: FrontSide,
      vertexColors: true,
    });
  }

  /**
   * //NOTE might now work well with water since is only front sided
   * so if you look up under water you won't see anything
   *
   * A potential solution could be using a custom shader or a specific material for water
   */
  private createBlockTransparentMaterial() {
    return new MeshStandardMaterial({
      map: this.textureAtlas,
      side: FrontSide,
      alphaTest: 0.1,
      transparent: true,
      vertexColors: true,
    });
  }

  dispose() {
    Logger.info("Disposing materials...", Logger.DISPOSE_KEY);
    this.textureAtlas.dispose();
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
