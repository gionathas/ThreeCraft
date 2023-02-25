import * as THREE from "three";
import ChunkUtils from "../utils/ChunkUtils";
import { Coordinate } from "../utils/helpers";
import Block, { BlockData } from "./block/Block";
import Blocks, { BlockType } from "./block/BlockType";

export type ChunkID = string;

export interface ChunkModel {
  getBlock: (blockCoord: Coordinate) => BlockData | null;
}
export default class Chunk implements ChunkModel {
  private _chunkId: ChunkID;
  private chunkWidth: number;
  private chunkHeight: number;
  private blocks: Uint8Array;

  constructor(
    chunkId: ChunkID,
    chunkWidth: number,
    chunkHeight: number,
    blocks?: Uint8Array
  ) {
    this._chunkId = chunkId;
    this.chunkWidth = chunkWidth;
    this.chunkHeight = chunkHeight;
    this.blocks =
      blocks ?? new Uint8Array(chunkHeight * chunkWidth * chunkWidth);
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

  isFilled(coord: Coordinate) {
    return Block.isVisibleBlock(this.getBlock(coord)?.type);
  }

  isBlockInChunk(blockCoord: Coordinate) {
    const { chunkWidth, chunkHeight } = this;
    const actualChunkId = ChunkUtils.computeChunkIdFromPosition(
      blockCoord,
      chunkWidth,
      chunkHeight
    );
    return actualChunkId === this._chunkId;
  }

  private computeBlockIndex({ x, y, z }: Coordinate) {
    const { chunkWidth } = this;

    const [blockX, blockY, blockZ] = this.getBlockChunkCoordinates(x, y, z);

    return blockY * chunkWidth * chunkWidth + blockZ * chunkWidth + blockX;
  }

  private getBlockChunkCoordinates(x: number, y: number, z: number) {
    const { chunkWidth, chunkHeight } = this;

    const blockX = THREE.MathUtils.euclideanModulo(x, chunkWidth) | 0;
    const blockY = THREE.MathUtils.euclideanModulo(y, chunkHeight) | 0;
    const blockZ = THREE.MathUtils.euclideanModulo(z, chunkWidth) | 0;

    return [blockX, blockY, blockZ];
  }

  getBlocks() {
    return this.blocks;
  }

  get id() {
    return this._chunkId;
  }

  get width() {
    return this.chunkWidth;
  }

  get height() {
    return this.chunkHeight;
  }

  _debug() {
    console.log(this.blocks);
  }
}
