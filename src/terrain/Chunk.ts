import * as THREE from "three";
import ChunkUtils from "../utils/ChunkUtils";
import { Coordinate } from "../utils/helpers";
import {
  getBlockTextureCoordinates,
  Voxel,
  VoxelFace,
  VoxelFacesGeometry,
} from "./Voxel";

export type ChunkID = string;
export default class Chunk {
  private _chunkID: ChunkID;
  private chunkWidth: number;
  private chunkHeight: number;
  private voxels: Uint8Array;

  constructor(
    chunkID: ChunkID,
    chunkWidth: number,
    chunkHeight: number,
    voxels?: Uint8Array
  ) {
    this._chunkID = chunkID;
    this.chunkWidth = chunkWidth;
    this.chunkHeight = chunkHeight;
    this.voxels =
      voxels ?? new Uint8Array(chunkHeight * chunkWidth * chunkWidth);
  }

  //TODO optimization: to decrease the number of meshes, we could pass an object
  // which stores which borders this voxel must have visible
  computeGeometryData({ x: startX, y: startY, z: startZ }: Coordinate) {
    const { chunkWidth, chunkHeight } = this;

    const positions = [];
    const normals = [];
    const indices = [];
    const uvs = [];

    // voxels generation
    for (let y = 0; y < chunkHeight; ++y) {
      const voxelY = startY + y;
      for (let z = 0; z < chunkWidth; ++z) {
        const voxelZ = startZ + z;

        for (let x = 0; x < chunkWidth; ++x) {
          const voxelX = startX + x;

          const currVoxel = this.getVoxel({ x: voxelX, y: voxelY, z: voxelZ });

          if (currVoxel) {
            // iterate over each face of this voxel
            for (const face of Object.keys(VoxelFacesGeometry)) {
              const voxelFace = face as VoxelFace;
              const { normal: dir, corners } = VoxelFacesGeometry[voxelFace];

              // let's check the voxel neighbour of this face of the voxel
              const neighborVoxel = this.getVoxel({
                x: voxelX + dir[0],
                y: voxelY + dir[1],
                z: voxelZ + dir[2],
              });

              // if the voxel has no neighbor in this face, we need to show this face
              if (!neighborVoxel) {
                const ndx = positions.length / 3;

                for (const { pos, uv } of corners) {
                  // add corner position
                  positions.push(
                    pos[0] + voxelX,
                    pos[1] + voxelY,
                    pos[2] + voxelZ
                  );

                  // add normal for this corner
                  normals.push(...dir);

                  const textureCoords = getBlockTextureCoordinates(
                    currVoxel,
                    voxelFace,
                    [uv[0], uv[1]]
                  );

                  uvs.push(textureCoords.x, textureCoords.y);
                }

                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }

    return {
      positions,
      normals,
      indices,
      uvs,
    };
  }

  /**
   * Given a voxel position returns the value of the voxel in there.
   *
   * @returns the voxel value or null if the voxel does not belong to this chunk.
   */
  getVoxel(coord: Coordinate): Voxel | null {
    if (!this.isVoxelInChunk(coord)) {
      return null;
    }

    const voxelOffset = this.computeVoxelOffset(coord);
    return this.voxels[voxelOffset];
  }

  setVoxel(coord: Coordinate, voxel: Voxel) {
    // the voxel does not belong to this chunk, skip
    if (!this.isVoxelInChunk(coord)) {
      return;
    }

    const voxelOffset = this.computeVoxelOffset(coord);
    this.voxels[voxelOffset] = voxel;
  }

  /**
   *
   * @returns true if the voxel belongs to this chunk
   */
  isVoxelInChunk(voxelCoord: Coordinate) {
    const { chunkWidth, chunkHeight } = this;
    const actualChunkId = ChunkUtils.computeChunkIdFromPosition(
      voxelCoord,
      chunkWidth,
      chunkHeight
    );
    return actualChunkId === this._chunkID;
  }

  private computeVoxelOffset({ x, y, z }: Coordinate) {
    const { chunkWidth } = this;

    const [voxelX, voxelY, voxelZ] = this.getVoxelLocalCoordinates(x, y, z);

    return voxelY * chunkWidth * chunkWidth + voxelZ * chunkWidth + voxelX;
  }

  private getVoxelLocalCoordinates(x: number, y: number, z: number) {
    const { chunkWidth, chunkHeight } = this;

    const voxelX = THREE.MathUtils.euclideanModulo(x, chunkWidth) | 0;
    const voxelY = THREE.MathUtils.euclideanModulo(y, chunkHeight) | 0;
    const voxelZ = THREE.MathUtils.euclideanModulo(z, chunkWidth) | 0;

    return [voxelX, voxelY, voxelZ];
  }

  getVoxels() {
    return this.voxels;
  }

  get id() {
    return this._chunkID;
  }

  get width() {
    return this.chunkWidth;
  }

  get height() {
    return this.chunkHeight;
  }

  _debug() {
    console.log(this.voxels);
  }
}
