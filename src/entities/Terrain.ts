import * as THREE from "three";
import {
  BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS,
  CHUNK_HEIGHT,
  CHUNK_WIDTH,
  CLOUD_LEVEL,
  HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS,
  TERRAIN_GENERATION_ENABLED,
  TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS,
} from "../config/constants";
import { BlockType, BlockUtils } from "../terrain/Block";
import { ChunkModel } from "../terrain/Chunk";
import TerrainChunksFactory from "../terrain/TerrainChunksFactory";
import ChunkUtils from "../utils/ChunkUtils";
import { Coordinate } from "../utils/helpers";

const horizontalRenderDistance =
  HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS * CHUNK_WIDTH;

const verticalTopRenderDistance =
  TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS * CHUNK_HEIGHT;

const verticalBottomRenderDistance =
  BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS * CHUNK_HEIGHT;

type TerrainBoundaries = {
  lowerX: number;
  upperX: number;
  lowerY: number;
  upperY: number;
  lowerZ: number;
  upperZ: number;
};

export default class Terrain implements ChunkModel {
  private chunkFactory: TerrainChunksFactory;
  private scene: THREE.Scene;

  private previousCenterPosition: THREE.Vector3;

  constructor(scene: THREE.Scene, centerPosition: THREE.Vector3) {
    this.scene = scene;
    this.previousCenterPosition = centerPosition;
    this.chunkFactory = new TerrainChunksFactory(CHUNK_WIDTH, CHUNK_HEIGHT);
  }

  /**
   * //TODO: optimization: you could do some check between the previous and
   * current position to prevent the unload/load of the terrain
   */
  update(newCenterPosition: THREE.Vector3, isFirstUpdate: boolean = false) {
    const isGenerationEnabled = TERRAIN_GENERATION_ENABLED;

    const isSamePosition =
      this.previousCenterPosition.equals(newCenterPosition);

    if ((!isSamePosition && isGenerationEnabled) || isFirstUpdate) {
      const terrainBoundaries =
        this.getTerrainBoundariesFromPosition(newCenterPosition);
      this.unloadTerrain(terrainBoundaries);
      this.loadTerrain(terrainBoundaries);
      this.previousCenterPosition.copy(newCenterPosition);

      // console.debug(`solidPool: ${this.chunkFactory._poolSolidMeshSize}`);
      // console.log(`transPool: ${this.chunkFactory._poolTransparentMeshSize}`);
    }
  }

  private loadTerrain(boundaries: TerrainBoundaries) {
    const { lowerX, upperX, lowerY, upperY, lowerZ, upperZ } = boundaries;
    for (let x = lowerX; x < upperX; x += CHUNK_WIDTH) {
      for (let z = lowerZ; z < upperZ; z += CHUNK_WIDTH) {
        for (let y = lowerY; y < upperY; y += CHUNK_HEIGHT) {
          this.chunkFactory.generateChunk(
            { x, y, z },
            (solidMesh, transparentMesh) => {
              if (solidMesh) {
                this.scene.add(solidMesh);
              }

              if (transparentMesh) {
                this.scene.add(transparentMesh);
              }
            }
          );
        }
      }
    }
  }

  private unloadTerrain(boundaries: TerrainBoundaries) {
    const { lowerX, upperX, lowerY, upperY, lowerZ, upperZ } = boundaries;
    const loadedChunks = this.chunkFactory.loadedChunks;

    for (const chunk of loadedChunks) {
      const chunkOriginPosition = ChunkUtils.computeChunkAbsolutePosition(
        chunk.id,
        CHUNK_WIDTH,
        CHUNK_HEIGHT
      );

      if (
        chunkOriginPosition.x < lowerX ||
        chunkOriginPosition.x > upperX ||
        chunkOriginPosition.y < lowerY ||
        chunkOriginPosition.y > upperY ||
        chunkOriginPosition.z < lowerZ ||
        chunkOriginPosition.z > upperZ
      ) {
        const { solidMesh, transparentMesh } = this.chunkFactory.removeChunk(
          chunk.id
        );

        if (solidMesh) {
          this.scene.remove(solidMesh);
        }

        if (transparentMesh) {
          this.scene.remove(transparentMesh);
        }
      }
    }
  }

  private getTerrainBoundariesFromPosition({ x, y, z }: Coordinate) {
    const centerChunkOriginX = this.roundToNearestHorizontalChunk(x);
    const centerChunkOriginZ = this.roundToNearestHorizontalChunk(z);
    const centerChunkOriginY = this.roundToNearestVerticalChunk(y);

    const lowerX = centerChunkOriginX - horizontalRenderDistance;
    const upperX = centerChunkOriginX + horizontalRenderDistance;

    const upperZ = centerChunkOriginZ + horizontalRenderDistance;
    const lowerZ = centerChunkOriginZ - horizontalRenderDistance;

    const upperY = centerChunkOriginY + verticalTopRenderDistance;
    let lowerY = centerChunkOriginY - verticalBottomRenderDistance;

    // keep rendering at least 1 chunk as far as we are below the cloud level
    // and above the terrain surface
    if (lowerY < CLOUD_LEVEL && lowerY > -CHUNK_HEIGHT) {
      lowerY = -CHUNK_HEIGHT;
    }

    return { lowerX, upperX, lowerY, upperY, lowerZ, upperZ };
  }

  isSolidBlock(blockCoord: Coordinate): boolean {
    const block = this.getBlock(blockCoord);

    return BlockUtils.isSolidBlock(block?.type);
  }

  getBlock(blockCoord: Coordinate) {
    const chunkId = this.chunkFactory.computeChunkIdFromPosition(blockCoord);
    const chunk = this.chunkFactory.getChunk(chunkId);

    if (!chunk) {
      return null;
    }

    return chunk.getBlock(blockCoord);
  }

  setBlock(blockCoord: Coordinate, block: BlockType) {
    const chunkId = this.chunkFactory.computeChunkIdFromPosition(blockCoord);

    let chunk = this.chunkFactory.getChunk(chunkId);

    // add new chunk if we try to set a block in a chunk that does not exist yet
    if (!chunk) {
      chunk = this.chunkFactory.createChunk(chunkId);
    }

    chunk.setBlock(blockCoord, block);
    const { updatedChunkMesh, removedChunksIds } =
      this.chunkFactory.updateChunk(chunkId);

    for (const updatedChunk of updatedChunkMesh) {
      // if the chunk was not already in the scene, add it
      if (!this.scene.getObjectByName(updatedChunk.name)) {
        this.scene.add(updatedChunk);
      }
    }

    for (const removedChunkId of removedChunksIds) {
      const removedSolidMesh = this.scene.getObjectByName(
        TerrainChunksFactory.getChunkSolidMeshId(removedChunkId)
      );
      const removedTransparentMesh = this.scene.getObjectByName(
        TerrainChunksFactory.getChunkTransparentMeshId(removedChunkId)
      );

      if (removedSolidMesh) {
        this.scene.remove(removedSolidMesh);
      }

      if (removedTransparentMesh) {
        this.scene.remove(removedTransparentMesh);
      }
    }
  }

  private roundToNearestHorizontalChunk(val: number) {
    return Math.round(val / CHUNK_WIDTH) * CHUNK_WIDTH;
  }

  private roundToNearestVerticalChunk(val: number) {
    return Math.round(val / CHUNK_HEIGHT) * CHUNK_HEIGHT;
  }

  get loadedChunks() {
    return this.chunkFactory.loadedChunks;
  }

  get totalChunks() {
    return this.chunkFactory.totalChunks;
  }

  get _totalSolidMesh() {
    return this.chunkFactory.totalSolidChunksMesh;
  }

  get _totalTransparentMesh() {
    return this.chunkFactory.totalTransparentChunksMesh;
  }

  get _poolSolidMeshSize() {
    return this.chunkFactory._poolSolidMeshSize;
  }
}
