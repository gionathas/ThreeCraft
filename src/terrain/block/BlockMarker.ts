import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  PlaneGeometry,
} from "three";
import Block from "./Block";

export default class BlockMarker extends LineSegments {
  private edgesMaterial!: THREE.LineBasicMaterial;

  constructor() {
    super();
    this.initMaterials();
    this.initGeometries();
  }

  private initMaterials() {
    this.edgesMaterial = new LineBasicMaterial({
      color: 0x00000,
      depthWrite: true,
    });
  }

  private initGeometries() {
    const { edgesMaterial } = this;
    const markerPlaneGeom = new PlaneGeometry(Block.SIZE, Block.SIZE);
    const markerEdgesGeom = new EdgesGeometry(markerPlaneGeom);
    this.geometry = markerEdgesGeom;
    this.material = edgesMaterial;
  }

  adaptToBlock(blockPosition: THREE.Vector3, blockNormal: THREE.Vector3) {
    const [x, y, z] = blockPosition.toArray();
    const offsetFromBlock = 0.01;

    const planeX = Block.toBlockCenterCoord(x);
    const planeY = Block.toBlockCenterCoord(y);
    const planeZ = Block.toBlockCenterCoord(z);

    const face = Block.getBlockFaceFromNormal(blockNormal);

    switch (face) {
      case "top": {
        this.position.set(planeX, y + offsetFromBlock, planeZ);
        this.rotation.set(Math.PI / 2, 0, 0);
        break;
      }
      case "bottom": {
        this.position.set(planeX, y - offsetFromBlock, planeZ);
        this.rotation.set(Math.PI / 2, 0, 0);
        break;
      }
      case "front": {
        this.position.set(planeX, planeY, z + offsetFromBlock);
        this.rotation.set(0, 0, 0);
        break;
      }
      case "back": {
        this.position.set(planeX, planeY, z - offsetFromBlock);
        this.rotation.set(0, 0, 0);
        break;
      }
      case "left": {
        this.position.set(x - offsetFromBlock, planeY, planeZ);
        this.rotation.set(0, Math.PI / 2, 0);
        break;
      }
      case "right": {
        this.position.set(x + offsetFromBlock, planeY, planeZ);
        this.rotation.set(0, Math.PI / 2, 0);
        break;
      }
    }
  }
}
