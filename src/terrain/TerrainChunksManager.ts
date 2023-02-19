import { Pool, spawn } from "threads";
import * as THREE from "three";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../config/constants";
import TextureManager from "../core/TextureManager";
import TerrainMap from "../noise/TerrainMap";
import ChunkUtils from "../utils/ChunkUtils";
import {
  BufferGeometryData,
  Coordinate,
  isEmptyGeometry,
} from "../utils/helpers";
import { NeighbourBlockOffsets } from "./Block";
import Chunk, { ChunkID, ChunkModel } from "./Chunk";
import { TerrainGeneratorType } from "./TerrainChunkGeneratorWorker";
import TerrainGeneratorWorker from "./TerrainChunkGeneratorWorker?worker";

// WARN this value seems to affect the memory usage, keep it as low as possible
const MAX_SOLID_MESH_POOL_SIZE = 200;
const MAX_TRANSPARENT_MESH_POOL_SIZE = 50;

export default class TerrainChunksManager implements ChunkModel {
  private terrainMap: TerrainMap;

  private chunks: Map<ChunkID, Chunk>;
  private solidMesh: Map<ChunkID, THREE.Mesh>;
  private transparentMesh: Map<ChunkID, THREE.Mesh>;
  private solidMeshPool: Array<THREE.Mesh>;
  private transparentMeshPool: Array<THREE.Mesh>;
  private processingChunks: Set<ChunkID>;
  private generatorsPool;

  constructor(terrainMap: TerrainMap) {
    this.terrainMap = terrainMap;
    this.chunks = new Map();
    this.solidMesh = new Map();
    this.transparentMesh = new Map();
    this.solidMeshPool = [];
    this.transparentMeshPool = [];
    this.processingChunks = new Set();
    this.generatorsPool = Pool(() =>
      spawn<TerrainGeneratorType>(new TerrainGeneratorWorker())
    );
  }

  generateChunk(
    chunkCoord: Coordinate,
    onComplete: (
      solidMesh: THREE.Mesh | null,
      transparentMesh: THREE.Mesh | null
    ) => void
  ) {
    const chunkId = ChunkUtils.computeChunkIdFromPosition(
      chunkCoord,
      CHUNK_WIDTH,
      CHUNK_HEIGHT
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
      const { solidGeometry, transparentGeometry, blocksBuffer, time } =
        await generateChunks(chunkId, this.terrainMap.getSeed());

      // console.log(time);

      // mark this chunk as processed
      this.processingChunks.delete(chunkId);

      // @ts-ignore retrieve the chunk blocks
      const blocks = new Uint8Array(...blocksBuffer.transferables);

      const hasSolidMesh = !isEmptyGeometry(solidGeometry);
      const hasTransparentMesh = !isEmptyGeometry(transparentGeometry);

      let solidMesh = null;
      let transparentMesh = null;

      this.createChunk(chunkId, blocks);

      if (hasSolidMesh) {
        solidMesh = this.generateSolidMesh(chunkId, solidGeometry);
      }

      if (hasTransparentMesh) {
        transparentMesh = this.generateTransparentMesh(
          chunkId,
          transparentGeometry
        );
      }

      onComplete(solidMesh, transparentMesh);
    });
  }

  /**
   * Update the chunk which contain the block in the specified position.
   *
   * This operation will update also the neighbours blocks of the current block.
   * So if a neighbour block is positioned inside a different chunk rather than the original,
   * it will be updated as well.
   */
  updateChunk({ x, y, z }: Coordinate) {
    const updatedMesh = [];
    const removedMesh = [];

    // to keep track of the chunks already updated
    const visitedChunks: Record<ChunkID, boolean | undefined> = {};

    for (const offset of NeighbourBlockOffsets) {
      const ox = x + offset[0];
      const oy = y + offset[1];
      const oz = z + offset[2];

      const chunkId = this.computeChunkIdFromPosition({ x: ox, y: oy, z: oz });

      if (!visitedChunks[chunkId]) {
        // mark the current chunk as visited
        visitedChunks[chunkId] = true;

        const chunkToUpdate = this.chunks.get(chunkId);

        if (chunkToUpdate) {
          // get the chunk origin position
          const chunkOrigin = ChunkUtils.computeChunkAbsolutePosition(
            chunkId,
            CHUNK_WIDTH,
            CHUNK_HEIGHT
          );

          // update the chunk geometry
          const {
            solid: chunkSolidGeometry,
            transparent: chunkTransparentGeometry,
          } = ChunkUtils.computeChunkGeometry(
            chunkOrigin,
            this,
            CHUNK_WIDTH,
            CHUNK_HEIGHT,
            this.terrainMap
          );

          const hasSolidMesh = !isEmptyGeometry(chunkSolidGeometry);
          const hasTransparentMesh = !isEmptyGeometry(chunkTransparentGeometry);

          // update the chunk solid mesh
          if (hasSolidMesh) {
            const updatedSolidMesh = this.generateSolidMesh(
              chunkId,
              chunkSolidGeometry
            );

            // add to the list of updated chunks mesh
            updatedMesh.push(updatedSolidMesh);
          } else {
            // remove the chunk solid mesh since is empty
            const removedSolidMesh = this.removeChunkSolidMesh(chunkId);
            if (removedSolidMesh) {
              removedMesh.push(removedSolidMesh);
            }
          }

          // update the chunk transparent mesh
          if (hasTransparentMesh) {
            const updatedTransparentMesh = this.generateTransparentMesh(
              chunkId,
              chunkTransparentGeometry
            );

            // add to the list of updated chunks mesh
            updatedMesh.push(updatedTransparentMesh);
          } else {
            // remove the chunk transparent mesh since is empty
            const removedTransparentMesh =
              this.removeChunkTransparentMesh(chunkId);
            removedMesh.push(removedTransparentMesh);
          }
        }
      }
    }

    return { updatedMesh, removedMesh };
  }

  removeChunk(chunkId: ChunkID) {
    // find the chunk and the relative mesh
    const chunk = this.chunks.get(chunkId);

    // remove the chunk from the map
    if (chunk) {
      this.chunks.delete(chunkId);
    }

    const solidMesh = this.removeChunkSolidMesh(chunkId);
    const transparentMesh = this.removeChunkTransparentMesh(chunkId);

    return { chunk, solidMesh, transparentMesh };
  }

  private removeChunkSolidMesh(chunkId: ChunkID) {
    const solidMesh = this.solidMesh.get(chunkId);

    // remove chunk solid mesh
    if (solidMesh) {
      // remove from the chunks mesh map
      this.solidMesh.delete(chunkId);

      // let's reuse this mesh if the pool is not filled up
      if (this.solidMeshPool.length <= MAX_SOLID_MESH_POOL_SIZE) {
        this.solidMeshPool.push(solidMesh);
      } else {
        // dispose the mesh
        solidMesh.geometry.dispose();
      }
    }

    return solidMesh;
  }

  private removeChunkTransparentMesh(chunkId: ChunkID) {
    const transparentMesh = this.transparentMesh.get(chunkId);

    // remove chunk transparent mesh
    if (transparentMesh) {
      // remove from the chunks mesh map
      this.transparentMesh.delete(chunkId);

      // let's reuse this mesh if the pool is not filled up
      if (this.transparentMeshPool.length <= MAX_TRANSPARENT_MESH_POOL_SIZE) {
        this.transparentMeshPool.push(transparentMesh);
      } else {
        // dispose the mesh
        transparentMesh.geometry.dispose();
      }
    }

    return transparentMesh;
  }

  /**
   * Generate the chunk mesh for the specified chunkId and add it to the chunks mesh map
   */
  private generateSolidMesh(
    chunkId: ChunkID,
    { positions, normals, uvs, indices, aos }: BufferGeometryData
  ) {
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    const aoNumComponents = 3;

    const chunkMesh = this.getNewSolidMesh(chunkId);
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
    chunkGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(aos), aoNumComponents)
    );

    chunkGeometry.setIndex(indices);
    chunkGeometry.computeBoundingSphere();

    // update the chunk mesh name and add it to chunks mesh map
    chunkMesh.name = this.getChunkSolidMeshId(chunkId);
    this.solidMesh.set(chunkId, chunkMesh);

    return chunkMesh;
  }

  private generateTransparentMesh(
    chunkId: ChunkID,
    { positions, normals, uvs, indices }: BufferGeometryData
  ) {
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;

    const transparentMesh = this.getNewTransparentMesh(chunkId);
    const chunkGeometry = transparentMesh.geometry;

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
    transparentMesh.name = this.getChunkTransparentMeshId(chunkId);
    this.transparentMesh.set(chunkId, transparentMesh);

    return transparentMesh;
  }

  /**
   * Return the chunk mesh associated to the chunkID.
   *
   * If the mesh does not exist it will try either to extract one from the mesh pool,
   * or it will creates a new one
   */
  private getNewSolidMesh(chunkID: ChunkID): THREE.Mesh {
    const prevSolidMesh = this.solidMesh.get(chunkID);

    // if the mesh for the chunkId already exist return it
    if (prevSolidMesh) {
      return prevSolidMesh;
    }

    // extract the mesh from the pool
    let newMesh = this.solidMeshPool.pop();

    // pool is empty create a new mesh
    if (!newMesh) {
      const solidMaterial =
        TextureManager.getInstance().getSolidBlockMaterial();
      newMesh = new THREE.Mesh(new THREE.BufferGeometry(), solidMaterial);
    }

    return newMesh;
  }

  private getNewTransparentMesh(chunkID: ChunkID): THREE.Mesh {
    const prevTransparentMesh = this.transparentMesh.get(chunkID);

    // if the mesh for the chunkId already exist return it
    if (prevTransparentMesh) {
      return prevTransparentMesh;
    }

    // extract the mesh from the pool
    let newMesh = this.transparentMeshPool.pop();

    if (!newMesh) {
      const transparentMaterial =
        TextureManager.getInstance().getBlockTransparentMaterial();

      newMesh = new THREE.Mesh(new THREE.BufferGeometry(), transparentMaterial);
    }

    return newMesh;
  }

  /**
   * Create a new chunk with the specifed chunkId and add it inside chunks map
   */
  createChunk(chunkID: ChunkID, blocks?: Uint8Array): Chunk {
    const chunk = new Chunk(chunkID, CHUNK_WIDTH, CHUNK_HEIGHT, blocks);
    this.chunks.set(chunkID, chunk);

    return chunk;
  }

  getBlock(blockCoord: Coordinate) {
    const chunkId = this.computeChunkIdFromPosition(blockCoord);
    const chunk = this.getChunk(chunkId);

    if (!chunk) {
      return null;
    }

    return chunk.getBlock(blockCoord);
  }

  hasChunk(chunkId: ChunkID) {
    return this.chunks.has(chunkId);
  }

  getChunk(chunkId: ChunkID) {
    return this.chunks.get(chunkId);
  }

  getSolidChunkMesh(chunkId: ChunkID) {
    return this.solidMesh.get(chunkId);
  }

  computeChunkIdFromPosition(coord: Coordinate): ChunkID {
    return ChunkUtils.computeChunkIdFromPosition(
      coord,
      CHUNK_WIDTH,
      CHUNK_HEIGHT
    );
  }

  private getChunkSolidMeshId(chunkId: ChunkID) {
    return chunkId.concat("-solid");
  }

  private getChunkTransparentMeshId(chunkId: ChunkID) {
    return chunkId.concat("-transparent");
  }

  get loadedChunks() {
    return this.chunks.values();
  }

  get totalChunks() {
    return this.chunks.size;
  }

  get totalSolidChunksMesh() {
    return this.solidMesh.size;
  }

  get totalTransparentChunksMesh() {
    return this.transparentMesh.size;
  }

  get _poolSolidMeshSize() {
    return this.solidMeshPool.length;
  }

  get _poolTransparentMeshSize() {
    return this.transparentMeshPool.length;
  }

  get _processedChunksQueueSize() {
    return this.processingChunks.size;
  }
}
