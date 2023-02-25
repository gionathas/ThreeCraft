import * as THREE from "three";
import TextureAtlas from "../../core/TextureAtlas";

export default class BlockMaterial {
  private static instance: BlockMaterial;

  private blockSolidMaterial: THREE.MeshStandardMaterial;
  private blockTransparentMaterial: THREE.MeshStandardMaterial;

  private constructor() {
    const texture = TextureAtlas.getInstance().texture;

    this.blockSolidMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.FrontSide,
      vertexColors: true,
    });

    /**
     * //NOTE might now work well with water since is only front sided
     * so if you look up under water you won't see anything
     *
     * A potential solution could be using a custom shader or a specific material for water
     */
    this.blockTransparentMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.FrontSide,
      alphaTest: 0.1,
      transparent: true,
    });
  }

  public static getInstance(): BlockMaterial {
    if (!this.instance) {
      this.instance = new BlockMaterial();
    }
    return this.instance;
  }

  getSolidBlockMaterial() {
    return this.blockSolidMaterial;
  }

  getBlockTransparentMaterial() {
    return this.blockTransparentMaterial;
  }
}
