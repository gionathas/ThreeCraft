import { Pool, spawn, Transfer } from "threads";
import * as THREE from "three";
import DensityMap from "../../maps/DensityMap";
import TerrainShapeMap from "../../maps/TerrainShapeMap";
import { GlobalTreeMap } from "../../maps/tree";
import {
  BufferGeometryData,
  Coordinate,
  isEmptyGeometry,
} from "../../utils/helpers";
import { Block, BlockMaterial } from "../block";
import World from "../World";
import Chunk, { ChunkID, ChunkModel } from "./Chunk";
import { TerrainGeneratorType } from "./ChunkGeneratorWorker";
import ChunkGeneratorWorker from "./ChunkGeneratorWorker?worker";
import ChunkGeometryBuilder from "./ChunkGeometryBuilder";

// WARN this value seems to affect the memory usage, keep it as low as possible
const MAX_SOLID_MESH_POOL_SIZE = 200;
const MAX_TRANSPARENT_MESH_POOL_SIZE = 50;

//TODO rename into terrain
export default class ChunkManager implements ChunkModel {
  private terrainShapeMap: TerrainShapeMap;
  private treeMap: GlobalTreeMap;
  private densityMap: DensityMap;

  private loadedChunks: Map<ChunkID, Chunk>;
  private solidMesh: Map<ChunkID, THREE.Mesh>;
  private transparentMesh: Map<ChunkID, THREE.Mesh>;
  private solidMeshPool: Array<THREE.Mesh>;
  private transparentMeshPool: Array<THREE.Mesh>;

  private processingChunks: Set<ChunkID>;
  private generatorsPool;

  private chunkGeometryBuilder: ChunkGeometryBuilder;

  constructor(
    terrainShapeMap: TerrainShapeMap,
    densityMap: DensityMap,
    treeMap: GlobalTreeMap
  ) {
    this.terrainShapeMap = terrainShapeMap;
    this.treeMap = treeMap;
    this.densityMap = densityMap;

    this.loadedChunks = new Map();
    this.solidMesh = new Map();
    this.transparentMesh = new Map();
    this.solidMeshPool = [];
    this.transparentMeshPool = [];
    this.processingChunks = new Set();
    this.generatorsPool = Pool(() =>
      spawn<TerrainGeneratorType>(new ChunkGeneratorWorker())
    );

    this.chunkGeometryBuilder = new ChunkGeometryBuilder(
      terrainShapeMap,
      densityMap
    );
  }

  generateChunkAt(
    position: Coordinate,
    onComplete: (chunkMesh: THREE.Mesh[]) => void
  ) {
    const chunkId = World.getChunkIdFromPosition(position);

    const isChunkLoaded = this.loadedChunks.has(chunkId);
    const isChunkBeingProcessed = this.processingChunks.has(chunkId);

    // if the current chunk already exist or is already being processed by another worker, skip
    if (isChunkLoaded || isChunkBeingProcessed) {
      return;
    }

    // add this chunk to the list of processed chunks
    this.processingChunks.add(chunkId);

    // enqueue the creation of this new chunk
    this.generatorsPool.queue(async (generateChunk) => {
      const chunkTreeMap = this.treeMap.loadChunkTreeMap(chunkId);

      const { solidGeometry, transparentGeometry, blocksBuffer, time } =
        await generateChunk(
          chunkId,
          this.terrainShapeMap.getSeed(),
          Transfer(chunkTreeMap.buffer)
        );

      // @ts-ignore retrieve the chunk blocks
      const blocks = new Uint8Array(...blocksBuffer.transferables);
      this.loadChunk(chunkId, blocks);

      // mark this chunk as processed
      this.processingChunks.delete(chunkId);

      const chunkMeshes = [];
      const hasSolidMesh = !isEmptyGeometry(solidGeometry);
      const hasTransparentMesh = !isEmptyGeometry(transparentGeometry);

      if (hasSolidMesh) {
        const solidMesh = this.generateChunkSolidMesh(chunkId, solidGeometry);
        chunkMeshes.push(solidMesh);
      }

      if (hasTransparentMesh) {
        const transparentMesh = this.generateChunkTransparentMesh(
          chunkId,
          transparentGeometry
        );
        chunkMeshes.push(transparentMesh);
      }

      onComplete(chunkMeshes);
    });
  }

  /**
   * Update the chunk which contain the block in the specified position.
   *
   * This operation will update also the neighbours blocks of the current block.
   * So if a neighbour block is positioned inside a different chunk rather than the original,
   * it will be updated as well.
   */
  updateChunkAt({ x, y, z }: Coordinate) {
    const updatedMesh = [];
    const removedMesh = [];

    // to keep track of the chunks already updated
    const visitedChunks: Record<ChunkID, boolean | undefined> = {};

    for (const blockOffset of Block.getNeighbourBlockOffsets()) {
      const ox = x + blockOffset[0];
      const oy = y + blockOffset[1];
      const oz = z + blockOffset[2];

      const chunkId = World.getChunkIdFromPosition({ x: ox, y: oy, z: oz });

      if (!visitedChunks[chunkId]) {
        // mark the current chunk as visited
        visitedChunks[chunkId] = true;

        const chunkToUpdate = this.loadedChunks.get(chunkId);

        if (chunkToUpdate) {
          // get the chunk origin position
          const chunkWorldOrigin = chunkToUpdate.getWorldOriginPosition();

          // update the chunk geometry
          const {
            solid: chunkSolidGeometry,
            transparent: chunkTransparentGeometry,
          } = this.chunkGeometryBuilder.buildChunkGeometry(
            this,
            chunkWorldOrigin
          );

          const hasSolidMesh = !isEmptyGeometry(chunkSolidGeometry);
          const hasTransparentMesh = !isEmptyGeometry(chunkTransparentGeometry);

          // update the chunk solid mesh
          if (hasSolidMesh) {
            const updatedSolidMesh = this.generateChunkSolidMesh(
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
            const updatedTransparentMesh = this.generateChunkTransparentMesh(
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
    this.unloadChunk(chunkId);

    const solidMesh = this.removeChunkSolidMesh(chunkId);
    const transparentMesh = this.removeChunkTransparentMesh(chunkId);

    return [solidMesh, transparentMesh];
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

  private generateChunkSolidMesh(
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

  private generateChunkTransparentMesh(
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
      const solidMaterial = BlockMaterial.getInstance().getSolidBlockMaterial();
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
        BlockMaterial.getInstance().getBlockTransparentMaterial();
      newMesh = new THREE.Mesh(new THREE.BufferGeometry(), transparentMaterial);
    }

    return newMesh;
  }

  /**
   * Create a new chunk with the specifed chunkId and add it inside chunks map
   */
  loadChunk(chunkID: ChunkID, blocks?: Uint8Array): Chunk {
    const chunk = new Chunk(chunkID, blocks);
    this.loadedChunks.set(chunkID, chunk);

    return chunk;
  }

  unloadChunk(chunkId: ChunkID) {
    this.loadedChunks.delete(chunkId);
    this.treeMap.unloadChunkTreeMap(chunkId);
  }

  getBlock(blockCoord: Coordinate) {
    const chunkId = World.getChunkIdFromPosition(blockCoord);
    const chunk = this.getChunk(chunkId);

    if (!chunk) {
      return null;
    }

    return chunk.getBlock(blockCoord);
  }

  isChunkLoaded(chunkId: ChunkID) {
    return this.loadedChunks.has(chunkId);
  }

  getChunk(chunkId: ChunkID) {
    return this.loadedChunks.get(chunkId);
  }

  getSolidChunkMesh(chunkId: ChunkID) {
    return this.solidMesh.get(chunkId);
  }

  private getChunkSolidMeshId(chunkId: ChunkID) {
    return chunkId.concat("-solid");
  }

  private getChunkTransparentMeshId(chunkId: ChunkID) {
    return chunkId.concat("-transparent");
  }

  getLoadedChunks() {
    return this.loadedChunks.values();
  }

  get totalChunks() {
    return this.loadedChunks.size;
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
