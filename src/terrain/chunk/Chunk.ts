import * as THREE from "three";
import EnvVars from "../../config/EnvVars";
import { Coordinate } from "../../utils/helpers";
import { BlockData, BlockRegistry, BlockType } from "../block";
import World from "../World";

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

  constructor(chunkId: ChunkID, blocks?: Uint8Array) {
    this.chunkId = chunkId;
    this.worldOriginPosition = World.getChunkOriginPosition(chunkId);
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
    const blockChunkId = World.getChunkIdFromPosition(blockCoord);

    return blockChunkId === this.chunkId;
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

  static buildChunkId({ x, y, z }: Coordinate): ChunkID {
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
