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
