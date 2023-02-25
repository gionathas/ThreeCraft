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
  side0: [number, number, number];
  side1: [number, number, number];
  side2: [number, number, number];
};

export type BlockFaceGeometry = {
  normal: [number, number, number];
  vertices: {
    pos: [number, number, number];
    uv: [number, number];
    ao: BlockFaceAO;
  }[];
};

export const BlockFaceNormal: Record<BlockFace, [number, number, number]> = {
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
      {
        pos: [0, 1, 0],
        uv: [0, 1],
        ao: {
          side0: [-0.5, -0.5, 0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      {
        pos: [0, 0, 0],
        uv: [0, 0],
        ao: {
          side0: [-0.5, -0.5, 0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      {
        pos: [0, 1, 1],
        uv: [1, 1],
        ao: {
          side0: [-0.5, 0.5, -0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
      {
        pos: [0, 0, 1],
        uv: [1, 0],
        ao: {
          side0: [-0.5, -0.5, -0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
    ],
  },
  right: {
    normal: BlockFaceNormal.right,
    vertices: [
      {
        pos: [1, 1, 1],
        uv: [0, 1],
        ao: {
          side0: [0.5, 0.5, -0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [0.5, -0.5, 0.5],
        },
      },
      {
        pos: [1, 0, 1],
        uv: [0, 0],
        ao: {
          side0: [0.5, -0.5, -0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [0.5, -0.5, 0.5],
        },
      },
      {
        pos: [1, 1, 0],
        uv: [1, 1],
        ao: {
          side0: [0.5, 0.5, 0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      {
        pos: [1, 0, 0],
        uv: [1, 0],
        ao: {
          side0: [0.5, -0.5, 0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
    ],
  },
  top: {
    normal: BlockFaceNormal.top,
    vertices: [
      {
        pos: [0, 1, 1],
        uv: [1, 1],
        ao: {
          side0: [-0.5, 0.5, 0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [-0.5, 0.5, -0.5],
        },
      },
      {
        pos: [1, 1, 1],
        uv: [0, 1],
        ao: {
          side0: [0.5, 0.5, 0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [0.5, 0.5, -0.5],
        },
      },
      {
        pos: [0, 1, 0],
        uv: [1, 0],
        ao: {
          side0: [-0.5, 0.5, -0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [-0.5, 0.5, 0.5],
        },
      },
      {
        pos: [1, 1, 0],
        uv: [0, 0],
        ao: {
          side0: [0.5, 0.5, -0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [0.5, 0.5, 0.5],
        },
      },
    ],
  },
  bottom: {
    normal: BlockFaceNormal.bottom,
    vertices: [
      {
        pos: [1, 0, 1],
        uv: [1, 0],
        ao: {
          side0: [0.5, -0.5, 0.5],
          side1: [-0.5, -0.5, 0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      {
        pos: [0, 0, 1],
        uv: [0, 0],
        ao: {
          side0: [-0.5, -0.5, 0.5],
          side1: [0.5, -0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
      {
        pos: [1, 0, 0],
        uv: [1, 1],
        ao: {
          side0: [0.5, -0.5, -0.5],
          side1: [0.5, -0.5, 0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      {
        pos: [0, 0, 0],
        uv: [0, 1],
        ao: {
          side0: [-0.5, -0.5, -0.5],
          side1: [0.5, -0.5, -0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
    ],
  },
  front: {
    normal: BlockFaceNormal.front,
    vertices: [
      {
        pos: [0, 0, 1],
        uv: [0, 0],
        ao: {
          side0: [0.5, -0.5, 0.5],
          side1: [-0.5, 0.5, 0.5],
          side2: [-0.5, -0.5, 0.5],
        },
      },
      {
        pos: [1, 0, 1],
        uv: [1, 0],
        ao: {
          side0: [-0.5, -0.5, 0.5],
          side1: [0.5, 0.5, 0.5],
          side2: [0.5, -0.5, 0.5],
        },
      },
      {
        pos: [0, 1, 1],
        uv: [0, 1],
        ao: {
          side0: [0.5, 0.5, 0.5],
          side1: [-0.5, -0.5, 0.5],
          side2: [-0.5, 0.5, 0.5],
        },
      },
      {
        pos: [1, 1, 1],
        uv: [1, 1],
        ao: {
          side0: [-0.5, 0.5, 0.5],
          side1: [0.5, -0.5, 0.5],
          side2: [0.5, 0.5, 0.5],
        },
      },
    ],
  },
  back: {
    normal: BlockFaceNormal.back,
    vertices: [
      {
        pos: [1, 0, 0],
        uv: [0, 0],
        ao: {
          side0: [-0.5, -0.5, -0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      {
        pos: [0, 0, 0],
        uv: [1, 0],
        ao: {
          side0: [0.5, -0.5, -0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
      {
        pos: [1, 1, 0],
        uv: [0, 1],
        ao: {
          side0: [-0.5, 0.5, -0.5],
          side1: [0.5, 0.5, -0.5],
          side2: [0.5, -0.5, -0.5],
        },
      },
      {
        pos: [0, 1, 0],
        uv: [1, 1],
        ao: {
          side0: [0.5, 0.5, -0.5],
          side1: [-0.5, 0.5, -0.5],
          side2: [-0.5, -0.5, -0.5],
        },
      },
    ],
  },
};
