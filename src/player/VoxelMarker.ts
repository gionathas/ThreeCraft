import * as THREE from "three";
import { detectFace, VOXEL_SIZE } from "../terrain/Voxel";

export default class VoxelMarker extends THREE.LineSegments {
  private edgesMaterial!: THREE.LineBasicMaterial;

  constructor() {
    super();
    this.initMaterials();
    this.initGeometries();
  }

  private initMaterials() {
    this.edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x00000,
      depthWrite: true,
    });
  }

  private initGeometries() {
    const { edgesMaterial } = this;
    const markerPlaneGeom = new THREE.PlaneGeometry(VOXEL_SIZE, VOXEL_SIZE);
    const markerEdgesGeom = new THREE.EdgesGeometry(markerPlaneGeom);
    this.geometry = markerEdgesGeom;
    this.material = edgesMaterial;
  }

  adaptToVoxel(voxelPosition: THREE.Vector3, voxelNormal: THREE.Vector3) {
    const [x, y, z] = voxelPosition.toArray();
    const offsetFromVoxel = 0.01;

    const toVoxelCenterCoord = (val: number) =>
      Math.floor(val / VOXEL_SIZE) * VOXEL_SIZE + VOXEL_SIZE / 2;

    const planeX = toVoxelCenterCoord(x);
    const planeY = toVoxelCenterCoord(y);
    const planeZ = toVoxelCenterCoord(z);

    const face = detectFace(voxelNormal);

    switch (face) {
      case "Top": {
        this.position.set(planeX, y + offsetFromVoxel, planeZ);
        this.rotation.set(Math.PI / 2, 0, 0);
        break;
      }
      case "Bottom": {
        this.position.set(planeX, y - offsetFromVoxel, planeZ);
        this.rotation.set(Math.PI / 2, 0, 0);
        break;
      }
      case "Front": {
        this.position.set(planeX, planeY, z + offsetFromVoxel);
        this.rotation.set(0, 0, 0);
        break;
      }
      case "Back": {
        this.position.set(planeX, planeY, z - offsetFromVoxel);
        this.rotation.set(0, 0, 0);
        break;
      }
      case "Left": {
        this.position.set(x - offsetFromVoxel, planeY, planeZ);
        this.rotation.set(0, Math.PI / 2, 0);
        break;
      }
      case "Right": {
        this.position.set(x + offsetFromVoxel, planeY, planeZ);
        this.rotation.set(0, Math.PI / 2, 0);
        break;
      }
    }
  }
}
