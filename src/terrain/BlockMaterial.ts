import * as THREE from "three";
import TextureAtlas from "../core/TextureAtlas";

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

    this.blockTransparentMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      transparent: true,
      polygonOffset: true,
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1,
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
