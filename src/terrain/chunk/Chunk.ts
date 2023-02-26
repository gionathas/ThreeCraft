import * as THREE from "three";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../../config/constants";
import { Coordinate } from "../../utils/helpers";
import { BlockData } from "../block/Block";
import Blocks, { BlockType } from "../block/BlockType";

export type ChunkID = string;

export interface ChunkModel {
  getBlock: (blockCoord: Coordinate) => BlockData | null;
}
export default class Chunk implements ChunkModel {
  static readonly WIDTH = CHUNK_WIDTH;
  static readonly HEIGHT = CHUNK_HEIGHT;

  private chunkId: ChunkID;
  private worldOriginPosition: Coordinate;
  private blocks: Uint8Array;

  constructor(chunkId: ChunkID, blocks?: Uint8Array) {
    this.chunkId = chunkId;
    this.worldOriginPosition = Chunk.computeWorldOriginPosition(chunkId);
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
      ...Blocks[blockType],
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
    const actualChunkId = Chunk.getChunkIdFromPosition(blockCoord);

    return actualChunkId === this.chunkId;
  }

  private computeBlockIndex({ x, y, z }: Coordinate) {
    const [blockX, blockY, blockZ] = this.getBlockLocalCoordinates(x, y, z);

    return blockY * Chunk.WIDTH * Chunk.WIDTH + blockZ * Chunk.WIDTH + blockX;
  }

  private getBlockLocalCoordinates(x: number, y: number, z: number) {
    const blockX = THREE.MathUtils.euclideanModulo(x, Chunk.WIDTH) | 0;
    const blockY = THREE.MathUtils.euclideanModulo(y, Chunk.HEIGHT) | 0;
    const blockZ = THREE.MathUtils.euclideanModulo(z, Chunk.WIDTH) | 0;

    return [blockX, blockY, blockZ];
  }

  /**
   * Compute the chunk origin position from the its chunk id
   *
   * e.g. if we ask for the chunkId (1,0,0) with a chunkWidth and chunkHeight of 32,
   * we will get back the chunkId (32,0,0)
   */
  static computeWorldOriginPosition(chunkID: ChunkID): Coordinate {
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

    return Chunk.coordinatesAsChunkId({
      x: chunkX,
      y: chunkY,
      z: chunkZ,
    });
  }

  static coordinatesAsChunkId({ x, y, z }: Coordinate): ChunkID {
    return `${x},${y},${z}`;
  }

  static chunkIdAsCoordinate(chunkID: ChunkID): Coordinate {
    const [x, y, z] = chunkID.split(",").map((val) => Number(val));
    return { x, y, z };
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
    console.log(this.blocks);
  }
}
