import { Pool, spawn, Transfer } from "threads";
import * as THREE from "three";
import GameDataManager from "../../io/GameDataManager";
import GlobalMapManager from "../../maps/GlobalMapManager";
import { TerrainMap } from "../../maps/terrain";
import { GlobalTreeMap } from "../../maps/tree";
import {
  BufferGeometryData,
  Coordinate,
  isEmptyGeometry,
} from "../../utils/helpers";
import { Block } from "../block";
import World from "../World";
import Chunk, { ChunkID, ChunkModel } from "./Chunk";
import { ChunkGeneratorWorkerType } from "./ChunkGeneratorWorker";
import ChunkGeneratorWorker from "./ChunkGeneratorWorker?worker";
import ChunkGeometryBuilder from "./ChunkGeometryBuilder";
import ChunkMeshManager from "./ChunkMeshManager";

export default class ChunkManager implements ChunkModel {
  private globalMapManager: GlobalMapManager;
  private terrainMap: TerrainMap;
  private treeMap: GlobalTreeMap;

  private loadedChunks: Map<ChunkID, Chunk>;
  private processingChunks: Set<ChunkID>;

  private chunkMeshManager: ChunkMeshManager;
  private generatorsPool;

  private chunkGeometryBuilder: ChunkGeometryBuilder;
  private dataManager: GameDataManager;

  constructor(globalMapManager: GlobalMapManager) {
    this.globalMapManager = globalMapManager;
    this.terrainMap = this.globalMapManager.getTerrainMap();
    this.treeMap = this.globalMapManager.getTreeMap();

    this.loadedChunks = new Map();
    this.chunkMeshManager = new ChunkMeshManager();

    this.processingChunks = new Set();
    this.generatorsPool = Pool(() =>
      spawn<ChunkGeneratorWorkerType>(new ChunkGeneratorWorker())
    );

    this.chunkGeometryBuilder = new ChunkGeometryBuilder(this.terrainMap);
    this.dataManager = GameDataManager.getInstance();
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
    return this.generatorsPool.queue(async (generateChunk) => {
      let solidGeometry: BufferGeometryData | undefined;
      let transparentGeometry: BufferGeometryData | undefined;
      const chunkMeshes = [];

      const savedChunk = await this.dataManager.getSavedChunk(chunkId);

      // if the chunk was previously saved, load it from the data storage
      if (savedChunk) {
        // load the saved chunk
        this.loadedChunks.set(chunkId, savedChunk);

        // retrieve the saved chunk geometries
        const persistedChunkGeometry =
          await this.dataManager.getSavedChunkGeometry(chunkId);

        solidGeometry = persistedChunkGeometry!.solidGeometry;
        transparentGeometry = persistedChunkGeometry!.transparentGeometry;
      } else {
        const seed = this.globalMapManager.getSeed();

        // load the chunk tree map data
        const chunkTreeMap = this.treeMap.loadChunkTreeMapData(chunkId);

        // generate the new chunk
        const newChunk = await generateChunk(
          chunkId,
          seed,
          Transfer(chunkTreeMap.buffer)
        );

        // @ts-ignore retrieve the chunk blocks
        const blocks = new Uint8Array(...newChunk.blocksBuffer.transferables);
        this.loadChunk(chunkId, blocks);

        solidGeometry = newChunk.solidGeometry;
        transparentGeometry = newChunk.transparentGeometry;
      }

      // mark this chunk as processed
      this.processingChunks.delete(chunkId);

      if (solidGeometry != null && !isEmptyGeometry(solidGeometry)) {
        const solidMesh = this.chunkMeshManager.generateChunkSolidMesh(
          chunkId,
          solidGeometry
        );
        chunkMeshes.push(solidMesh);
      }

      if (
        transparentGeometry != null &&
        !isEmptyGeometry(transparentGeometry)
      ) {
        const transparentMesh =
          this.chunkMeshManager.generateChunkTransparentMesh(
            chunkId,
            transparentGeometry
          );
        chunkMeshes.push(transparentMesh);
      }

      onComplete(chunkMeshes);
    });
  }

  /**
   * Update the chunk which contains the block in the specified position.
   *
   * This operation will also update the neighbours blocks of the specified position.
   *
   * So if a neighbour block is positioned within a different chunk rather than the original,
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

          // mark this chunk as dirty, so it will be saved when the chunk is unloaded
          chunkToUpdate.markAsDirt();

          // update the chunk geometry
          const {
            solid: chunkSolidGeometry,
            transparent: chunkTransparentGeometry,
          } = this.chunkGeometryBuilder.buildChunkGeometry(
            this,
            chunkWorldOrigin
          );

          const isSolidMeshVisible = !isEmptyGeometry(chunkSolidGeometry);
          const isTransparentMeshVisible = !isEmptyGeometry(
            chunkTransparentGeometry
          );

          // update the chunk solid mesh
          if (isSolidMeshVisible) {
            const updatedSolidMesh =
              this.chunkMeshManager.generateChunkSolidMesh(
                chunkId,
                chunkSolidGeometry
              );

            // add to the list of updated chunks mesh
            updatedMesh.push(updatedSolidMesh);
          } else {
            // remove the chunk solid mesh since has become empty
            const removedSolidMesh =
              this.chunkMeshManager.removeChunkSolidMesh(chunkId);

            if (removedSolidMesh) {
              removedMesh.push(removedSolidMesh);
            }
          }

          // update the chunk transparent mesh
          if (isTransparentMeshVisible) {
            const updatedTransparentMesh =
              this.chunkMeshManager.generateChunkTransparentMesh(
                chunkId,
                chunkTransparentGeometry
              );

            // add to the list of updated chunks mesh
            updatedMesh.push(updatedTransparentMesh);
          } else {
            // remove the chunk transparent mesh since has become empty
            const removedTransparentMesh =
              this.chunkMeshManager.removeChunkTransparentMesh(chunkId);
            removedMesh.push(removedTransparentMesh);
          }
        }
      }
    }

    return { updatedMesh, removedMesh };
  }

  removeChunk(chunkId: ChunkID) {
    this.unloadChunk(chunkId);

    const solidMesh = this.chunkMeshManager.removeChunkSolidMesh(chunkId);
    const transparentMesh =
      this.chunkMeshManager.removeChunkTransparentMesh(chunkId);

    return [solidMesh, transparentMesh];
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
    const chunk = this.loadedChunks.get(chunkId);

    if (chunk) {
      const { x, y, z } = chunk.getWorldOriginPosition();

      // remove chunk from the loaded chunks
      this.loadedChunks.delete(chunkId);

      // unload map data related to this chunk
      this.globalMapManager.unloadMapsRegionAt(x, y, z);
      this.treeMap.unloadChunkTreeMapData(chunkId);

      // persist chunk data if it's dirty
      if (chunk.isDirty()) {
        const solidGeometry =
          this.chunkMeshManager.getSolidChunkMesh(chunkId)?.geometry;
        const transparentGeometry =
          this.chunkMeshManager.getTransparentChunkMesh(chunkId)?.geometry;

        const solid =
          solidGeometry &&
          ChunkGeometryBuilder.extractBufferGeometryDataFromGeometry(
            solidGeometry
          );

        const transparent =
          transparentGeometry &&
          ChunkGeometryBuilder.extractBufferGeometryDataFromGeometry(
            transparentGeometry
          );

        this.dataManager.saveChunkData(chunk, solid, transparent);
      }
    }
  }

  getBlock(blockCoord: Coordinate) {
    const chunkId = World.getChunkIdFromPosition(blockCoord);
    const chunk = this.getChunk(chunkId);

    if (!chunk) {
      return null;
    }

    return chunk.getBlock(blockCoord);
  }

  dispose() {
    console.debug("Disposing chunks...");

    // unload all the currently loaded chunks
    for (const chunk of this.loadedChunks.values()) {
      this.unloadChunk(chunk.getId());
    }

    this.loadedChunks.clear();
    this.processingChunks.clear();
    this.chunkMeshManager.dispose();

    console.debug("Chunks disposed");
  }

  isChunkLoaded(chunkId: ChunkID) {
    return this.loadedChunks.has(chunkId);
  }

  getChunk(chunkId: ChunkID) {
    return this.loadedChunks.get(chunkId);
  }

  getLoadedChunks() {
    return this.loadedChunks.values();
  }

  get totalChunks() {
    return this.loadedChunks.size;
  }

  get _processedChunksQueueSize() {
    return this.processingChunks.size;
  }

  get _solidMeshPoolSize() {
    return this.chunkMeshManager._solidMeshPoolSize;
  }

  get _transparentMeshPoolSize() {
    return this.chunkMeshManager._transparentMeshPoolSize;
  }
}
