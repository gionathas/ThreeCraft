import { MathUtils } from "three";
import EnvVars from "../../config/EnvVars";
import Logger from "../../tools/Logger";
import { Coordinate } from "../../utils/helpers";
import { BlockData, BlockRegistry, BlockType } from "../block";
import BlockGenerator from "../block/generators/BlockGenerator";

export type ChunkID = string;

export interface ChunkModel {
  getBlock: (blockCoord: Coordinate) => BlockData | null;
}
export default class Chunk implements ChunkModel {
  static readonly WIDTH = EnvVars.CHUNK_WIDTH;
  static readonly HEIGHT = EnvVars.CHUNK_HEIGHT;

  private chunkId: ChunkID;
  private worldOriginPosition: Coordinate;
  private blocks: Uint8Array;
  private isDirt: boolean;

  constructor(chunkId: ChunkID, blocks?: Uint8Array) {
    this.chunkId = chunkId;
    this.worldOriginPosition = Chunk.getChunkOriginPosition(chunkId);
    this.isDirt = false;
    this.blocks =
      blocks ?? new Uint8Array(Chunk.HEIGHT * Chunk.WIDTH * Chunk.WIDTH);
  }

  getBlock(coord: Coordinate): BlockData | null {
    if (!this.isBlockInChunk(coord)) {
      return null;
    }

    const blockIndex = this.computeBlockIndex(coord);
    const blockType = this.blocks[blockIndex] as BlockType;

    return {
      type: blockType,
      ...BlockRegistry[blockType],
    };
  }

  setBlock(coord: Coordinate, block: BlockType) {
    if (!this.isBlockInChunk(coord)) {
      return;
    }

    const blockIndex = this.computeBlockIndex(coord);
    this.blocks[blockIndex] = block;
  }

  isBlockInChunk(blockCoord: Coordinate) {
    const blockChunkId = Chunk.getChunkIdFromPosition(blockCoord);

    return blockChunkId === this.chunkId;
  }

  decorateChunk(blockGenerator: BlockGenerator) {
    const { x: startX, y: startY, z: startZ } = this.getWorldOriginPosition();

    const endX = startX + Chunk.WIDTH;
    const endY = startY + Chunk.HEIGHT;
    const endZ = startZ + Chunk.WIDTH;

    // filling the chunk with blocks from bottom to top
    for (let y = startY; y < endY; y++) {
      for (let z = startZ; z < endZ; z++) {
        for (let x = startX; x < endX; x++) {
          const blockCoord = { x, y, z };

          const block = blockGenerator.generateBlock(x, y, z);

          if (block) {
            this.setBlock(blockCoord, block);
          }
        }
      }
    }
  }

  private computeBlockIndex({ x, y, z }: Coordinate) {
    const [blockX, blockY, blockZ] = this.getBlockLocalCoordinates(x, y, z);

    return blockY * Chunk.WIDTH * Chunk.WIDTH + blockZ * Chunk.WIDTH + blockX;
  }

  private getBlockLocalCoordinates(x: number, y: number, z: number) {
    const blockX = MathUtils.euclideanModulo(x, Chunk.WIDTH) | 0;
    const blockY = MathUtils.euclideanModulo(y, Chunk.HEIGHT) | 0;
    const blockZ = MathUtils.euclideanModulo(z, Chunk.WIDTH) | 0;

    return [blockX, blockY, blockZ];
  }

  static buildChunkId({ x, y, z }: Coordinate): ChunkID {
    return `${x},${y},${z}`;
  }

  static chunkIdAsCoordinate(chunkID: ChunkID): Coordinate {
    const matches = chunkID.match(/^([^,]+),([^,]+),(.+)$/);
    if (!matches) {
      throw new Error("Invalid chunkId");
    }

    const [_, x, y, z] = matches;
    return { x: Number(x), y: Number(y), z: Number(z) };
  }

  /**
   * Return the chunkID of the chunk that is supposed to contain the specified position
   *
   * e.g. if we ask for the coordinates (35,0,0) which is located in the chunk with id (1,0,0)
   * its corresponding chunk id will be "1,0,0".
   */
  static getChunkIdFromPosition({ x, y, z }: Coordinate): ChunkID {
    const chunkX = Math.floor(x / Chunk.WIDTH);
    const chunkY = Math.floor(y / Chunk.HEIGHT);
    const chunkZ = Math.floor(z / Chunk.WIDTH);

    return Chunk.buildChunkId({
      x: chunkX,
      y: chunkY,
      z: chunkZ,
    });
  }

  /**
   * Compute the chunk origin position from the its chunk id
   *
   * e.g. if we ask for the chunkId (1,0,0) with a chunkWidth of 32,
   * we will get back the following chunkId (32,0,0)
   */
  static getChunkOriginPosition(chunkID: ChunkID): Coordinate {
    const {
      x: chunkX,
      y: chunkY,
      z: chunkZ,
    } = Chunk.chunkIdAsCoordinate(chunkID);

    const offsetStartX = chunkX * Chunk.WIDTH;
    const offsetStartY = chunkY * Chunk.HEIGHT;
    const offsetStartZ = chunkZ * Chunk.WIDTH;

    return { x: offsetStartX, y: offsetStartY, z: offsetStartZ };
  }

  markAsDirt() {
    this.isDirt = true;
  }

  isDirty() {
    return this.isDirt;
  }

  getId() {
    return this.chunkId;
  }

  getWorldOriginPosition() {
    return this.worldOriginPosition;
  }

  getBlocks() {
    return this.blocks;
  }

  _debug() {
    Logger.debug(JSON.stringify(this.blocks), Logger.TERRAIN_KEY);
  }
}
