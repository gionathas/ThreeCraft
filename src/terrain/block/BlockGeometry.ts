import { Vector2Tuple, Vector3Tuple } from "three";

enum BlockFaceEnum {
  left,
  right,
  top,
  bottom,
  front,
  back,
}

export type BlockFace = keyof typeof BlockFaceEnum;

export type BlockFaceAO = {
  corner: Vector3Tuple;
  side1: Vector3Tuple;
  side2: Vector3Tuple;
};

export type BlockFaceGeometry = {
  normal: Vector3Tuple;
  vertices: {
    pos: Vector3Tuple;
    uv: Vector2Tuple;
    ao: BlockFaceAO;
  }[];
};

export const BlockFaceNormal: Record<BlockFace, Vector3Tuple> = {
  left: [-1, 0, 0],
  right: [1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};

export const BlockFacesGeometry: Record<BlockFace, BlockFaceGeometry> = {
  left: {
    normal: BlockFaceNormal.left,
    vertices: [
      // top left
      {
        pos: [0, 1, 0],
        uv: [0, 1],
        ao: {
          corner: [-0.5, -0.5, 0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      // bottom left
      {
        pos: [0, 0, 0],
        uv: [0, 0],
        ao: {
          corner: [-0.5, -0.5, 0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      // top right
      {
        pos: [0, 1, 1],
        uv: [1, 1],
        ao: {
          corner: [-0.5, 0.5, -0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
      // bottom right
      {
        pos: [0, 0, 1],
        uv: [1, 0],
        ao: {
          corner: [-0.5, -0.5, -0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
    ],
  },
  right: {
    normal: BlockFaceNormal.right,
    vertices: [
      // top left
      {
        pos: [1, 1, 1],
        uv: [0, 1],
        ao: {
          corner: [0.5, 0.5, -0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [0.5, -0.5, 0.5],
        },
      },
      // bottom left
      {
        pos: [1, 0, 1],
        uv: [0, 0],
        ao: {
          corner: [0.5, -0.5, -0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [0.5, -0.5, 0.5],
        },
      },
      // top right
      {
        pos: [1, 1, 0],
        uv: [1, 1],
        ao: {
          corner: [0.5, 0.5, 0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      // bottom right
      {
        pos: [1, 0, 0],
        uv: [1, 0],
        ao: {
          corner: [0.5, -0.5, 0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
    ],
  },
  top: {
    normal: BlockFaceNormal.top,
    vertices: [
      // bottom left
      {
        pos: [0, 1, 1],
        uv: [1, 1],
        ao: {
          corner: [-0.5, 0.5, 0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [-0.5, 0.5, -0.5],
        },
      },
      // bottom right
      {
        pos: [1, 1, 1],
        uv: [0, 1],
        ao: {
          corner: [0.5, 0.5, 0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [0.5, 0.5, -0.5],
        },
      },
      // top left
      {
        pos: [0, 1, 0],
        uv: [1, 0],
        ao: {
          corner: [-0.5, 0.5, -0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [-0.5, 0.5, 0.5],
        },
      },
      // top right
      {
        pos: [1, 1, 0],
        uv: [0, 0],
        ao: {
          corner: [0.5, 0.5, -0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [0.5, 0.5, 0.5],
        },
      },
    ],
  },
  bottom: {
    normal: BlockFaceNormal.bottom,
    vertices: [
      // top right
      {
        pos: [1, 0, 1],
        uv: [1, 0],
        ao: {
          corner: [0.5, -0.5, 0.5],
          side1: [-0.5, -0.5, 0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      // top left
      {
        pos: [0, 0, 1],
        uv: [0, 0],
        ao: {
          corner: [-0.5, -0.5, 0.5],
          side1: [0.5, -0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
      // bottom right
      {
        pos: [1, 0, 0],
        uv: [1, 1],
        ao: {
          corner: [0.5, -0.5, -0.5],
          side1: [0.5, -0.5, 0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      // bottom left
      {
        pos: [0, 0, 0],
        uv: [0, 1],
        ao: {
          corner: [-0.5, -0.5, -0.5],
          side1: [0.5, -0.5, -0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
    ],
  },
  front: {
    normal: BlockFaceNormal.front,
    vertices: [
      // bottom left
      {
        pos: [0, 0, 1],
        uv: [0, 0],
        ao: {
          corner: [0.5, -0.5, 0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
      // bottom right
      {
        pos: [1, 0, 1],
        uv: [1, 0],
        ao: {
          corner: [-0.5, -0.5, 0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [0.5, -0.5, 0.5],
        },
      },
      // top left
      {
        pos: [0, 1, 1],
        uv: [0, 1],
        ao: {
          corner: [0.5, 0.5, 0.5],
          side1: [-0.5, -0.5, 0.5],
          side2: [-0.5, 0.5, 0.5],
        },
      },
      // top right
      {
        pos: [1, 1, 1],
        uv: [1, 1],
        ao: {
          corner: [-0.5, 0.5, 0.5],
          side1: [0.5, -0.5, 0.5],
          side2: [0.5, 0.5, 0.5],
        },
      },
    ],
  },
  back: {
    normal: BlockFaceNormal.back,
    vertices: [
      // bottom left
      {
        pos: [1, 0, 0],
        uv: [0, 0],
        ao: {
          corner: [-0.5, -0.5, -0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      // bottom right
      {
        pos: [0, 0, 0],
        uv: [1, 0],
        ao: {
          corner: [0.5, -0.5, -0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      // top left
      {
        pos: [1, 1, 0],
        uv: [0, 1],
        ao: {
          corner: [-0.5, 0.5, -0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      // top right
      {
        pos: [0, 1, 0],
        uv: [1, 1],
        ao: {
          corner: [0.5, 0.5, -0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
    ],
  },
};
