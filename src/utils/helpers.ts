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

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function isEmptyGeometry(geometry: BufferGeometryData) {
  return geometry.positions.length === 0;
}

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

  console.error("invalid angle", angle);
  throw new Error("Invalid angle");
}

export function getOrientationFromAngle(angle: number): "n" | "e" | "s" | "w" {
  const pi = Math.PI;
  const northRange = [-pi / 4, pi / 4];
  const eastRange = [(-3 * pi) / 4, -pi / 4];
  const westRange = [pi / 4, (3 * pi) / 4];
  const southRange = [(-3 * pi) / 4, pi / 4];

  if (angle >= northRange[0] && angle <= northRange[1]) {
    return "n";
  } else if (angle > eastRange[0] && angle <= eastRange[1]) {
    return "e";
  } else if (angle >= westRange[0] && angle <= westRange[1]) {
    return "w";
  } else {
    return "s";
  }
}
