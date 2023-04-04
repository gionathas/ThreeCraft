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
  PLANKS,
  COAL_ORE,
}

export const BlockRegistry: Record<BlockType, BlockMetadata> = {
  [BlockType.AIR]: {
    name: "_air",
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
    name: "Stone",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.COBBLESTONE,
    icon: {
      row: 48,
      col: 12,
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
    sounds: {
      dig: [
        "Stone_dig1.ogg",
        "Stone_dig2.ogg",
        "Stone_dig3.ogg",
        "Stone_dig4.ogg",
      ],
      hit: [
        "Stone_hit1.ogg",
        "Stone_hit2.ogg",
        "Stone_hit3.ogg",
        "Stone_hit4.ogg",
        "Stone_hit5.ogg",
        "Stone_hit6.ogg",
      ],
    },
  },
  [BlockType.COBBLESTONE]: {
    name: "Cobblestone",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.COBBLESTONE,
    icon: {
      row: 8,
      col: 31,
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
    sounds: {
      dig: [
        "Stone_dig1.ogg",
        "Stone_dig2.ogg",
        "Stone_dig3.ogg",
        "Stone_dig4.ogg",
      ],
      hit: [
        "Stone_hit1.ogg",
        "Stone_hit2.ogg",
        "Stone_hit3.ogg",
        "Stone_hit4.ogg",
        "Stone_hit5.ogg",
        "Stone_hit6.ogg",
      ],
    },
  },
  [BlockType.GRASS]: {
    name: "Grass",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.DIRT,
    icon: {
      row: 16,
      col: 27,
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
    sounds: {
      dig: [
        "Grass_dig1.ogg",
        "Grass_dig2.ogg",
        "Grass_dig3.ogg",
        "Grass_dig4.ogg",
      ],
      hit: [
        "Grass_hit1.ogg",
        "Grass_hit2.ogg",
        "Grass_hit3.ogg",
        "Grass_hit4.ogg",
        "Grass_hit5.ogg",
        "Grass_hit6.ogg",
      ],
    },
  },
  [BlockType.GRASS_SNOW]: {
    name: "Snow",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.DIRT,
    icon: {
      row: 13,
      col: 18,
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
    name: "Dirt",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.DIRT,
    icon: {
      row: 13,
      col: 18,
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
    sounds: {
      dig: [
        "Gravel_dig1.ogg",
        "Gravel_dig2.ogg",
        "Gravel_dig3.ogg",
        "Gravel_dig4.ogg",
      ],
      hit: [
        "Gravel_hit1.ogg",
        "Gravel_hit2.ogg",
        "Gravel_hit3.ogg",
        "Gravel_hit4.ogg",
      ],
    },
  },
  [BlockType.OAK_LOG]: {
    name: "Oak_Log",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.OAK_LOG,
    icon: {
      row: 25,
      col: 9,
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
    sounds: {
      dig: ["Wood_dig1.ogg", "Wood_dig2.ogg", "Wood_dig3.ogg", "Wood_dig4.ogg"],
      hit: [
        "Wood_hit1.ogg",
        "Wood_hit2.ogg",
        "Wood_hit3.ogg",
        "Wood_hit4.ogg",
        "Wood_hit5.ogg",
        "Wood_hit6.ogg",
      ],
    },
  },
  [BlockType.OAK_LEAVES]: {
    name: "Oak_Leaves",
    isTransparent: true,
    isSolid: true,
    icon: {
      row: 25,
      col: 8,
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
    sounds: {
      dig: [
        "Grass_dig1.ogg",
        "Grass_dig2.ogg",
        "Grass_dig3.ogg",
        "Grass_dig4.ogg",
      ],
      hit: [
        "Grass_hit1.ogg",
        "Grass_hit2.ogg",
        "Grass_hit3.ogg",
        "Grass_hit4.ogg",
        "Grass_hit5.ogg",
        "Grass_hit6.ogg",
      ],
    },
  },
  [BlockType.PLANKS]: {
    name: "Planks",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.PLANKS,
    icon: {
      row: 25,
      col: 10,
    },
    texture: {
      top: {
        row: 1,
        col: 4,
      },
      bottom: {
        row: 1,
        col: 4,
      },
      side: {
        row: 1,
        col: 4,
      },
    },
    sounds: {
      dig: ["Wood_dig1.ogg", "Wood_dig2.ogg", "Wood_dig3.ogg", "Wood_dig4.ogg"],
      hit: [
        "Wood_hit1.ogg",
        "Wood_hit2.ogg",
        "Wood_hit3.ogg",
        "Wood_hit4.ogg",
        "Wood_hit5.ogg",
        "Wood_hit6.ogg",
      ],
    },
  },
  [BlockType.SAND]: {
    name: "Sand",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.SAND,
    icon: {
      row: 32,
      col: 6,
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
    sounds: {
      dig: ["Sand_dig1.ogg", "Sand_dig2.ogg", "Sand_dig3.ogg", "Sand_dig4.ogg"],
      hit: [
        "Sand_hit1.ogg",
        "Sand_hit2.ogg",
        "Sand_hit3.ogg",
        "Sand_hit4.ogg",
        "Sand_hit5.ogg",
      ],
    },
  },
  [BlockType.WATER]: {
    name: "Water",
    isTransparent: true,
    isSolid: false,
    icon: {
      row: 37,
      col: 28,
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
    name: "Glass",
    isTransparent: true,
    isSolid: true,
    icon: {
      row: 15,
      col: 26,
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
    sounds: {
      dig: [
        "Stone_dig1.ogg",
        "Stone_dig2.ogg",
        "Stone_dig3.ogg",
        "Stone_dig4.ogg",
      ],
    },
  },
  [BlockType.COAL_ORE]: {
    name: "Coal_Ore",
    isTransparent: false,
    isSolid: true,
    drop: BlockType.COAL_ORE,
    icon: {
      row: 8,
      col: 25,
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
    sounds: {
      dig: [
        "Stone_dig1.ogg",
        "Stone_dig2.ogg",
        "Stone_dig3.ogg",
        "Stone_dig4.ogg",
      ],
      hit: [
        "Stone_hit1.ogg",
        "Stone_hit2.ogg",
        "Stone_hit3.ogg",
        "Stone_hit4.ogg",
        "Stone_hit5.ogg",
        "Stone_hit6.ogg",
      ],
    },
  },
};
