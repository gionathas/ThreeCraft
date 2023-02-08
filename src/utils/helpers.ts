import { VoxelModel } from "../terrain/Voxel";

export type Axis = "x" | "y" | "z";

export type Coordinate = { x: number; y: number; z: number };

export type UV = { u: number; v: number };

export type Direction =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "up"
  | "down";

export type BufferGeometryData = {
  indices: number[];
  normals: number[];
  positions: number[];
  uvs: number[];
};

export function determineAngleQuadrant(angle: number): 1 | 2 | 3 | 4 {
  if (angle > 0 && angle <= Math.PI / 2) {
    return 1;
  } else if (angle > -Math.PI / 2 && angle <= 0) {
    return 2;
  } else if (angle > -Math.PI && angle <= -Math.PI / 2) {
    return 3;
  } else if (angle > Math.PI / 2 && angle <= Math.PI) {
    return 4;
  }

  throw new Error("Invalid angle");
}

/**
 * This is a raycast implementation optmized for voxels
 */
export const intersectVoxel = (
  rayStart: THREE.Vector3,
  rayEnd: THREE.Vector3,
  voxels: VoxelModel
) => {
  let dx = rayEnd.x - rayStart.x;
  let dy = rayEnd.y - rayStart.y;
  let dz = rayEnd.z - rayStart.z;

  // calculate the length of the ray
  const lenSq = dx * dx + dy * dy + dz * dz;
  const len = Math.sqrt(lenSq);

  // normalize the 3 dimensions of the ray
  dx /= len;
  dy /= len;
  dz /= len;

  // tracking the current position along the ray and the current voxel being checked
  let t = 0.0;
  let ix = Math.floor(rayStart.x);
  let iy = Math.floor(rayStart.y);
  let iz = Math.floor(rayStart.z);

  // steps for moving in a positive or negative direction in each dimension
  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;

  // tracking the time required to the next voxel boundary in each dimension
  const txDelta = Math.abs(1 / dx);
  const tyDelta = Math.abs(1 / dy);
  const tzDelta = Math.abs(1 / dz);

  // calculate the distance to the nearest voxel boundary in each dimension.
  const xDist = stepX > 0 ? ix + 1 - rayStart.x : rayStart.x - ix;
  const yDist = stepY > 0 ? iy + 1 - rayStart.y : rayStart.y - iy;
  const zDist = stepZ > 0 ? iz + 1 - rayStart.z : rayStart.z - iz;

  // location of nearest voxel boundary, in units of t
  let txMax = txDelta < Infinity ? txDelta * xDist : Infinity;
  let tyMax = tyDelta < Infinity ? tyDelta * yDist : Infinity;
  let tzMax = tzDelta < Infinity ? tzDelta * zDist : Infinity;

  // keeps track of which dimension the current step is in
  let steppedIndex = -1;

  // until the current position along the ray is greater than the length of the ray
  while (t <= len) {
    const voxel = voxels.getBlock({ x: ix, y: iy, z: iz });

    // return position, normal and voxel value of the first voxel that we have found
    if (voxel) {
      return {
        position: [
          rayStart.x + t * dx,
          rayStart.y + t * dy,
          rayStart.z + t * dz,
        ],
        normal: [
          steppedIndex === 0 ? -stepX : 0,
          steppedIndex === 1 ? -stepY : 0,
          steppedIndex === 2 ? -stepZ : 0,
        ],
        voxel,
      };
    }

    // advance t to next nearest voxel boundary
    const minMax = Math.min(txMax, tyMax, tzMax);
    if (minMax === txMax) {
      ix += stepX;
      t = txMax;
      txMax += txDelta;
      steppedIndex = 0;
    } else if (minMax === tyMax) {
      iy += stepY;
      t = tyMax;
      tyMax += tyDelta;
      steppedIndex = 1;
    } else {
      iz += stepZ;
      t = tzMax;
      tzMax += tzDelta;
      steppedIndex = 2;
    }
  }

  // no voxel found along the ray
  return null;
};
