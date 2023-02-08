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
import TerrainChunksFactory from "../terrain/TerrainChunksFactory";
import { Voxel, VoxelModel } from "../terrain/Voxel";
import ChunkUtils from "../utils/ChunkUtils";
import { Coordinate } from "../utils/helpers";

const horizontalRenderDistance =
  HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS * CHUNK_WIDTH;

const verticalTopRenderDistance =
  TOP_VERTICAL_RENDER_DISTANCE_IN_CHUNKS * CHUNK_HEIGHT;

const verticalBottomRenderDistance =
  BOTTOM_VERTICAL_RENDER_DISTANCE_IN_CHUNKS * CHUNK_HEIGHT;

export default class Terrain implements VoxelModel {
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
      this.unloadTerrainFrom(newCenterPosition);
      this.loadTerrainFrom(newCenterPosition);
      this.previousCenterPosition.copy(newCenterPosition);

      // console.debug(`meshPool: ${this.chunkFactory._poolMeshSize}`);
    }
  }

  private loadTerrainFrom(centerCoords: Coordinate) {
    const { lowerX, upperX, lowerY, upperY, lowerZ, upperZ } =
      this.getTerrainBoundariesFromPosition(centerCoords);

    for (let x = lowerX; x < upperX; x += CHUNK_WIDTH) {
      for (let z = lowerZ; z < upperZ; z += CHUNK_WIDTH) {
        for (let y = lowerY; y < upperY; y += CHUNK_HEIGHT) {
          this.chunkFactory.generateChunk({ x, y, z }, (newChunkMesh) => {
            this.scene.add(newChunkMesh);
          });
        }
      }
    }
  }

  private unloadTerrainFrom(centerCoords: Coordinate) {
    const { lowerX, upperX, lowerY, upperY, lowerZ, upperZ } =
      this.getTerrainBoundariesFromPosition(centerCoords);

    const loadedChunks = this.chunkFactory.loadedChunks;

    for (const chunk of loadedChunks) {
      const chunkOriginPosition = ChunkUtils.computeChunkOriginPosition(
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
        const { chunkMesh: removedMesh } = this.chunkFactory.removeChunk(
          chunk.id
        );

        if (removedMesh) {
          this.scene.remove(removedMesh);
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
    if (lowerY < CLOUD_LEVEL && lowerY > 0) {
      lowerY = 0;
    }

    return { lowerX, upperX, lowerY, upperY, lowerZ, upperZ };
  }

  isSolidBlock(blockCoord: Coordinate): boolean {
    const block = this.getBlock(blockCoord);

    return block != null && block != Voxel.AIR;
  }

  /**
   * Given a voxel position returns the value of the voxel there.
   *
   * @returns the voxel value or null if the chunk does not exist
   *
   */
  getBlock(blockCoord: Coordinate): Voxel | null {
    const chunkId = this.chunkFactory.computeChunkIdFromPosition(blockCoord);
    const chunk = this.chunkFactory.getChunk(chunkId);

    if (!chunk) {
      return null;
    }

    return chunk.getVoxel(blockCoord);
  }

  /**
   * Set the specified voxel into his relative chunk.
   *
   * If the chunk doesn't exist it will create a new one.
   */
  setBlock(blockCoord: Coordinate, voxel: Voxel) {
    const chunkId = this.chunkFactory.computeChunkIdFromPosition(blockCoord);

    let chunk = this.chunkFactory.getChunk(chunkId);

    // add new chunk if we try to set a voxel in a chunk that does not exist yet
    if (!chunk) {
      chunk = this.chunkFactory.createChunk(chunkId);
    }

    chunk.setVoxel(blockCoord, voxel);
    const { updatedChunks, removedChunksIds } =
      this.chunkFactory.updateChunk(chunkId);

    for (const updatedChunk of updatedChunks) {
      // if the chunk was not already in the scene, add it
      if (!this.scene.getObjectByName(updatedChunk.name)) {
        this.scene.add(updatedChunk);
      }
    }

    for (const removedChunkId of removedChunksIds) {
      const removedMesh = this.scene.getObjectByName(removedChunkId);
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

  get _totalMesh() {
    return this.chunkFactory.totalChunksMesh;
  }
}
