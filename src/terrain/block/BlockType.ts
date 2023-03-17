import { BlockMetadata } from "./Block";

export enum BlockType {
  AIR = 0,
  STONE,
  COBBLESTONE,
  DIRT,
  GRASS,
  GRASS_SNOW,
  WATER,
  SAND,
  GLASS,
  OAK_LOG,
  OAK_LEAVES,
  COAL_ORE,
}

export const BlockRegistry: Record<BlockType, BlockMetadata> = {
  [BlockType.AIR]: {
    isTransparent: true,
    isSolid: false,
    icon: {
      row: -1,
      col: -1,
    },
    texture: {
      top: {
        row: -1,
        col: -1,
      },
      bottom: {
        row: -1,
        col: -1,
      },
      side: {
        row: -1,
        col: -1,
      },
    },
  },
  [BlockType.STONE]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.COBBLESTONE,
    icon: {
      row: 0,
      col: 2,
    },
    texture: {
      top: {
        row: 0,
        col: 5,
      },
      bottom: {
        row: 0,
        col: 5,
      },
      side: {
        row: 0,
        col: 5,
      },
    },
  },
  [BlockType.COBBLESTONE]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.COBBLESTONE,
    icon: {
      row: 0,
      col: 2,
    },
    texture: {
      top: {
        row: 0,
        col: 4,
      },
      bottom: {
        row: 0,
        col: 4,
      },
      side: {
        row: 0,
        col: 4,
      },
    },
  },
  [BlockType.GRASS]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.DIRT,
    icon: {
      row: 0,
      col: 0,
    },
    texture: {
      top: {
        row: 0,
        col: 1,
      },
      bottom: {
        row: 0,
        col: 2,
      },
      side: {
        row: 0,
        col: 0,
      },
    },
  },
  [BlockType.GRASS_SNOW]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.DIRT,
    icon: {
      row: -1,
      col: -1,
    },
    texture: {
      top: {
        row: 2,
        col: 5,
      },
      bottom: {
        row: 0,
        col: 2,
      },
      side: {
        row: 2,
        col: 4,
      },
    },
  },
  [BlockType.DIRT]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.DIRT,
    icon: {
      row: 0,
      col: 1,
    },
    texture: {
      top: {
        row: 0,
        col: 2,
      },
      bottom: {
        row: 0,
        col: 2,
      },
      side: {
        row: 0,
        col: 2,
      },
    },
  },
  [BlockType.OAK_LOG]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.OAK_LOG,
    icon: {
      row: 0,
      col: 5,
    },
    texture: {
      top: {
        row: 1,
        col: 2,
      },
      bottom: {
        row: 1,
        col: 2,
      },
      side: {
        row: 1,
        col: 3,
      },
    },
  },
  [BlockType.OAK_LEAVES]: {
    isTransparent: true,
    isSolid: true,
    icon: {
      row: 0,
      col: 0,
    },
    texture: {
      top: {
        row: 1,
        col: 5,
      },
      bottom: {
        row: 1,
        col: 5,
      },
      side: {
        row: 1,
        col: 5,
      },
    },
  },
  [BlockType.SAND]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.SAND,
    icon: {
      row: 0,
      col: 3,
    },
    texture: {
      top: {
        row: 1,
        col: 6,
      },
      bottom: {
        row: 1,
        col: 6,
      },
      side: {
        row: 1,
        col: 6,
      },
    },
  },
  [BlockType.WATER]: {
    isTransparent: true,
    isSolid: false,
    icon: {
      row: 0,
      col: 0,
    },
    texture: {
      side: {
        row: 1,
        col: 7,
      },
      top: {
        row: 1,
        col: 7,
      },
      bottom: {
        row: 1,
        col: 7,
      },
    },
  },
  [BlockType.GLASS]: {
    isTransparent: true,
    isSolid: true,
    icon: {
      row: 0,
      col: 6,
    },
    texture: {
      side: {
        row: 2,
        col: 0,
      },
      top: {
        row: 2,
        col: 0,
      },
      bottom: {
        row: 2,
        col: 0,
      },
    },
  },
  [BlockType.COAL_ORE]: {
    isTransparent: false,
    isSolid: true,
    drop: BlockType.COAL_ORE,
    icon: {
      row: 0,
      col: 4,
    },
    texture: {
      side: {
        row: 0,
        col: 6,
      },
      top: {
        row: 0,
        col: 6,
      },
      bottom: {
        row: 0,
        col: 6,
      },
    },
  },
};
