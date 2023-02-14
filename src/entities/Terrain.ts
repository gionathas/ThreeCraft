import * as THREE from "three";
import {
  BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS,
  CHUNK_HEIGHT,
  CHUNK_WIDTH,
  HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS,
  TERRAIN_GENERATION_ENABLED,
  TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS,
} from "../config/constants";
import TerrainMap from "../noise/TerrainMap";

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
  private scene: THREE.Scene;

  private seed: string;
  private chunkFactory: TerrainChunksFactory;
  private terrainMap: TerrainMap;
  private previousCenterPosition: THREE.Vector3;

  constructor(scene: THREE.Scene, centerPosition: THREE.Vector3) {
    this.scene = scene;
    this.previousCenterPosition = centerPosition;
    this.seed = "seed"; //FIXME
    this.terrainMap = new TerrainMap(this.seed);
    this.chunkFactory = new TerrainChunksFactory(
      CHUNK_WIDTH,
      CHUNK_HEIGHT,
      this.seed
    );
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

  //TODO optimization: instead of doing a 3 nested loop every frame,
  // to detect the new chunk to load (except for the initial terrain generation),
  // we can implement a diff between the previous terrain boundaries and the current boundaries
  // to find the chunk that needs to be loaded
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

    const surfaceHeight = this.terrainMap.getHeight(x, z);

    //FIXME 2 is an hacky way that appears to work
    // keep rendering at least 1 chunk as far as we are below the cloud level
    // and above the terrain surface
    lowerY = Math.min(lowerY, surfaceHeight - CHUNK_HEIGHT * 2);

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
    const { updatedMesh: updatedMeshList, removedMesh: removedMeshList } =
      this.chunkFactory.updateChunk(chunkId);

    for (const updatedMesh of updatedMeshList) {
      // if the chunk mesh was not already in the scene, add it
      if (!this.scene.getObjectByName(updatedMesh.name)) {
        this.scene.add(updatedMesh);
      }
    }

    // for each removed chunk, we need to remove both the solid and transparent mesh
    for (const removedMesh of removedMeshList) {
      if (removedMesh) {
        this.scene.remove(removedMesh);
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

  /**
   * //WARN if this function is invoked frequently
   * it can lead to an high memory usage due to his caching behavior,
   * use it only in debug mode
   */
  _getContinentalness(x: number, z: number) {
    return this.terrainMap.getContinentalness(x, z);
  }

  _getErosion(x: number, z: number) {
    return this.terrainMap.getErosion(x, z);
  }

  _getPV(x: number, z: number) {
    return this.terrainMap.getPV(x, z);
  }
}
