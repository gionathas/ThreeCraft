import * as THREE from "three";
import {
  DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS,
  MAX_WORLD_HEIGHT,
  MIN_WORLD_HEIGHT,
  TERRAIN_GENERATION_ENABLED,
} from "../config/constants";
import Engine from "../core/Engine";
import GlobalTreeMap from "../maps/tree/GlobalTreeMap";

import TerrainShapeMap from "../maps/TerrainShapeMap";
import { BlockType } from "../terrain/block/BlockType";
import { Chunk, ChunkManager } from "../terrain/chunk";
import { Coordinate } from "../utils/helpers";

const horizontalRenderDistance =
  DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS * Chunk.WIDTH;

type TerrainBoundaries = {
  lowerX: number;
  upperX: number;
  lowerY: number;
  upperY: number;
  lowerZ: number;
  upperZ: number;
};

//TODO rename into Chunk Loader
export default class Terrain {
  private scene: THREE.Scene;

  private seed: string;
  private chunksManager: ChunkManager;
  private previousCenterPosition: THREE.Vector3;

  private terrainShapeMap: TerrainShapeMap;
  private treeMap: GlobalTreeMap;

  constructor(centerPosition: THREE.Vector3) {
    this.scene = Engine.getInstance().getScene();
    this.previousCenterPosition = centerPosition;

    this.seed = "seed"; //FIXME
    this.terrainShapeMap = new TerrainShapeMap(this.seed);
    this.treeMap = new GlobalTreeMap(
      this.seed,
      this.terrainShapeMap.getHeightMap()
    );

    this.chunksManager = new ChunkManager(this.terrainShapeMap, this.treeMap);
  }

  // TODO optimization: trigger a terrain update only when the player
  // moves across a chunk boundary
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
    for (let x = lowerX; x < upperX; x += Chunk.WIDTH) {
      for (let z = lowerZ; z < upperZ; z += Chunk.WIDTH) {
        for (let y = upperY; y > lowerY; y -= Chunk.HEIGHT) {
          this.chunksManager.generateChunk(
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
    const loadedChunks = this.chunksManager.getLoadedChunks();

    for (const chunk of loadedChunks) {
      const chunkWorldOriginPosition = chunk.getWorldOriginPosition();

      if (
        chunkWorldOriginPosition.x < lowerX ||
        chunkWorldOriginPosition.x > upperX ||
        chunkWorldOriginPosition.y < lowerY ||
        chunkWorldOriginPosition.y > upperY ||
        chunkWorldOriginPosition.z < lowerZ ||
        chunkWorldOriginPosition.z > upperZ
      ) {
        const { solidMesh, transparentMesh } = this.chunksManager.removeChunk(
          chunk.getId()
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

    const lowerX = centerChunkOriginX - horizontalRenderDistance;
    const upperX = centerChunkOriginX + horizontalRenderDistance;

    const upperZ = centerChunkOriginZ + horizontalRenderDistance;
    const lowerZ = centerChunkOriginZ - horizontalRenderDistance;

    const upperY = MAX_WORLD_HEIGHT;
    const lowerY = MIN_WORLD_HEIGHT;

    return { lowerX, upperX, lowerY, upperY, lowerZ, upperZ };
  }

  setBlock(blockCoord: Coordinate, block: BlockType) {
    const chunkId = Chunk.getChunkIdFromPosition(blockCoord);

    let chunk = this.chunksManager.getChunk(chunkId);

    // laod a new chunk if we are trying to set a block in a chunk that does't exist yet
    if (!chunk) {
      chunk = this.chunksManager.loadChunk(chunkId);
    }

    // add/remove the block inside the chunk
    chunk.setBlock(blockCoord, block);

    // update all the affected chunks
    const { updatedMesh: updatedMeshList, removedMesh: removedMeshList } =
      this.chunksManager.updateChunk(blockCoord);

    for (const updatedMesh of updatedMeshList) {
      // if the chunk mesh was not already in the scene, add it
      if (!this.scene.getObjectByName(updatedMesh.name)) {
        this.scene.add(updatedMesh);
      }
    }

    // remove from the scene all the unnecesary chunk meshes
    for (const removedMesh of removedMeshList) {
      if (removedMesh) {
        this.scene.remove(removedMesh);
      }
    }
  }

  isSolidBlock(blockCoord: Coordinate): boolean {
    const block = this.getBlock(blockCoord);

    return block ? block.isSolid : false;
  }

  getBlock(blockCoord: Coordinate) {
    return this.chunksManager.getBlock(blockCoord);
  }

  private roundToNearestHorizontalChunk(val: number) {
    return Math.round(val / Chunk.WIDTH) * Chunk.WIDTH;
  }

  private roundToNearestVerticalChunk(val: number) {
    return Math.round(val / Chunk.HEIGHT) * Chunk.HEIGHT;
  }

  get totalChunks() {
    return this.chunksManager.totalChunks;
  }

  get _totalSolidMesh() {
    return this.chunksManager.totalSolidChunksMesh;
  }

  get _totalTransparentMesh() {
    return this.chunksManager.totalTransparentChunksMesh;
  }

  get _totalMesh() {
    return this._totalSolidMesh + this._totalTransparentMesh;
  }

  get _poolSolidMeshSize() {
    return this.chunksManager._poolSolidMeshSize;
  }

  getSurfaceHeight(x: number, z: number) {
    return this.terrainShapeMap.getSurfaceHeightAt(x, z);
  }

  /**
   * //WARN if this function is invoked frequently
   * it can lead to an high memory usage due to his caching behavior,
   * use it only in debug mode
   */
  _getContinentalness(x: number, z: number) {
    return this.terrainShapeMap.getContinentalnessAt(x, z);
  }

  _getErosion(x: number, z: number) {
    return this.terrainShapeMap.getErosionAt(x, z);
  }

  _getPV(x: number, z: number) {
    const erosion = this._getErosion(x, z);
    return this.terrainShapeMap.getPVAt(x, z, erosion);
  }
}
