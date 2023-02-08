import { Pool, spawn } from "threads";
import * as THREE from "three";
import TextureManager from "../core/TextureManager";
import ChunkUtils from "../utils/ChunkUtils";
import { BufferGeometryData, Coordinate } from "../utils/helpers";
import Chunk, { ChunkID } from "./Chunk";
import { TerrainGeneratorType } from "./TerrainChunkGeneratorWorker";
import TerrainGeneratorWorker from "./TerrainChunkGeneratorWorker?worker";

// WARN this value seems to affect the memory usage, keep it as low as possible
const MAX_CHUNK_MESH_POOL_SIZE = 200;

export default class TerrainChunksFactory {
  private chunkHeight: number;
  private chunkWidth: number;

  private chunks: Map<ChunkID, Chunk>;
  private chunksMesh: Map<ChunkID, THREE.Mesh>;
  private chunksMeshPool: Array<THREE.Mesh>;
  private chunkMaterial: THREE.MeshStandardMaterial;
  private processingChunks: Set<ChunkID>;
  private generatorsPool;

  constructor(chunkWidth: number, chunkHeight: number) {
    this.chunkWidth = chunkWidth;
    this.chunkHeight = chunkHeight;

    this.chunks = new Map();
    this.chunksMesh = new Map();
    this.chunksMeshPool = [];
    this.processingChunks = new Set();
    this.generatorsPool = Pool(() =>
      spawn<TerrainGeneratorType>(new TerrainGeneratorWorker())
    );

    const { texture } = TextureManager.getInstance();
    this.chunkMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.FrontSide,
      alphaTest: 0.1,
      transparent: true,
    });
  }

  generateChunk(
    chunkCoord: Coordinate,
    onComplete: (chunkMesh: THREE.Mesh) => void
  ) {
    const { chunkWidth, chunkHeight } = this;

    const chunkId = ChunkUtils.computeChunkIdFromPosition(
      chunkCoord,
      chunkWidth,
      chunkHeight
    );

    const existChunk = this.chunks.has(chunkId);

    // if the current chunk already exist or is already being processed by another worker, skip
    if (existChunk || this.processingChunks.has(chunkId)) {
      return;
    }

    // add this chunk to the list of processed chunks
    this.processingChunks.add(chunkId);

    // enqueue the creation of this new chunk
    this.generatorsPool.queue(async (generateChunks) => {
      const { geometry: chunkGeometry, voxelsBuffer } = await generateChunks(
        chunkCoord,
        chunkWidth,
        chunkHeight
      );

      // mark this chunk as processed
      this.processingChunks.delete(chunkId);

      // @ts-ignore retrieve the chunk voxels
      const voxels = new Uint8Array(...voxelsBuffer.transferables);

      // create the new chunk
      this.createChunk(chunkId, voxels);

      // avoid generating the mesh if its completely empty
      if (chunkGeometry.positions.length > 0) {
        const chunkMesh = this.generateChunkMesh(chunkId, chunkGeometry);
        onComplete(chunkMesh);
      }
    });
  }

  removeChunk(chunkId: ChunkID) {
    // find the chunk and the relative mesh
    const chunk = this.chunks.get(chunkId);
    const chunkMesh = this.chunksMesh.get(chunkId);

    if (chunk) {
      this.chunks.delete(chunkId);
    }

    if (chunkMesh) {
      // remove from the chunks mesh map
      this.chunksMesh.delete(chunkId);

      // let's reuse this mesh if the pool is not filled up
      if (this.chunksMeshPool.length <= MAX_CHUNK_MESH_POOL_SIZE) {
        this.chunksMeshPool.push(chunkMesh);
      } else {
        // dispose the mesh
        chunkMesh.geometry.dispose();
      }
    }

    return { chunk, chunkMesh };
  }

  /**
   * Trigger a chunk update on the chunk which contains the current position.
   *
   * This operation will update also the chunk neighbours,
   * in case the voxel is in the edge of the chunk
   *
   * @returns a list of all the updated chunk mesh
   */
  updateChunk(chunkId: ChunkID) {
    const { x, y, z } = ChunkUtils.computeChunkOriginPosition(
      chunkId,
      this.chunkWidth,
      this.chunkHeight
    );

    const neighborChunkOffsets = [
      [0, 0, 0], // self
      [-1, 0, 0], // left
      [1, 0, 0], // right
      [0, -1, 0], // down
      [0, 1, 0], // up
      [0, 0, -1], // back
      [0, 0, 1], // front
    ];

    const updatedChunks = [];
    const removedChunksIds = [];

    // to avoid updating same chunks
    const visitedChunks: Record<ChunkID, boolean | undefined> = {};

    for (const offset of neighborChunkOffsets) {
      const ox = x + offset[0];
      const oy = y + offset[1];
      const oz = z + offset[2];

      const chunkId = this.computeChunkIdFromPosition({ x: ox, y: oy, z: oz });

      if (!visitedChunks[chunkId]) {
        // mark the current chunk as visited
        visitedChunks[chunkId] = true;

        const chunkToUpdate = this.chunks.get(chunkId);

        if (chunkToUpdate) {
          // get the chunk  origin position
          const chunkOriginOffset = ChunkUtils.computeChunkOriginPosition(
            chunkId,
            this.chunkWidth,
            this.chunkHeight
          );

          // compute the new chunk geometry data
          const newGeometry =
            chunkToUpdate.computeGeometryData(chunkOriginOffset);

          // avoid re generate the chunk mesh if its empty
          if (newGeometry.positions.length > 0) {
            // update the chunk mesh
            const updatedChunkMesh = this.generateChunkMesh(
              chunkId,
              newGeometry
            );

            // add to the list of updated chunks
            updatedChunks.push(updatedChunkMesh);
          } else {
            // remove the chunk
            this.removeChunk(chunkId);

            // mark this chunk as removed since it has no vertices
            removedChunksIds.push(chunkId);
          }
        }
      }
    }

    return { updatedChunks, removedChunksIds };
  }

  /**
   * Generate the chunk mesh for the specified chunkId and add it to the chunks mesh map
   */
  private generateChunkMesh(
    chunkID: ChunkID,
    { positions, normals, uvs, indices }: BufferGeometryData
  ) {
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;

    const chunkMesh = this.getNewChunkMesh(chunkID);
    const chunkGeometry = chunkMesh.geometry;

    // update chunk geometry attributes
    chunkGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array(positions),
        positionNumComponents
      )
    );
    chunkGeometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
    );
    chunkGeometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
    );

    chunkGeometry.setIndex(indices);
    chunkGeometry.computeBoundingSphere();

    // update the chunk mesh name and add it to chunks mesh map
    chunkMesh.name = chunkID;
    this.chunksMesh.set(chunkID, chunkMesh);

    return chunkMesh;
  }

  /**
   * Create a new chunk with the specifed chunkId and add it inside chunks map
   */
  createChunk(chunkID: ChunkID, voxels?: Uint8Array): Chunk {
    const { chunkWidth, chunkHeight } = this;

    const chunk = new Chunk(chunkID, chunkWidth, chunkHeight, voxels);
    this.chunks.set(chunkID, chunk);

    return chunk;
  }

  /**
   * Return the chunk mesh associated to the chunkID.
   *
   * If the mesh does not exist it will try either to extract one from the mesh pool,
   * or it will creates a new one
   */
  private getNewChunkMesh(chunkID: ChunkID): THREE.Mesh {
    const prevChunkMesh = this.chunksMesh.get(chunkID);

    // if the mesh for the chunkId already exist return it
    if (prevChunkMesh) {
      return prevChunkMesh;
    }

    // extract the mesh from the pool
    let newMesh = this.chunksMeshPool.pop();

    // pool is empty create a new mesh
    if (!newMesh) {
      // console.count("new-mesh");
      newMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.chunkMaterial);
    }

    return newMesh;
  }

  hasChunk(chunkId: ChunkID) {
    return this.chunks.has(chunkId);
  }

  getChunk(chunkId: ChunkID) {
    return this.chunks.get(chunkId);
  }

  getChunkMesh(chunkId: ChunkID) {
    return this.chunksMesh.get(chunkId);
  }

  computeChunkIdFromPosition(coord: Coordinate): ChunkID {
    return ChunkUtils.computeChunkIdFromPosition(
      coord,
      this.chunkWidth,
      this.chunkHeight
    );
  }

  get loadedChunks() {
    return this.chunks.values();
  }

  get totalChunks() {
    return this.chunks.size;
  }

  get totalChunksMesh() {
    return this.chunksMesh.size;
  }

  get _poolMeshSize() {
    return this.chunksMeshPool.length;
  }

  get _processedChunksQueueSize() {
    return this.processingChunks.size;
  }
}
