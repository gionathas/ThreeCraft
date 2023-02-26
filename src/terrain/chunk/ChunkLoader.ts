import {
  DEFAULT_HORIZONTAL_RENDER_DISTANCE_IN_CHUNKS,
  MAX_WORLD_HEIGHT,
  MIN_WORLD_HEIGHT,
  TERRAIN_GENERATION_ENABLED,
} from "../../config/constants";
import Engine from "../../core/Engine";
import { Coordinate } from "../../utils/helpers";
import Chunk from "./Chunk";
import ChunkManager from "./ChunkManager";

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

export default class ChunkLoader {
  private scene: THREE.Scene;
  private chunksManager: ChunkManager;
  private previousCenterPosition: THREE.Vector3;

  constructor(centerPosition: THREE.Vector3, chunksManager: ChunkManager) {
    this.scene = Engine.getInstance().getScene();
    this.previousCenterPosition = centerPosition;
    this.chunksManager = chunksManager;
  }

  // TODO optimization: trigger a terrain update only when the player
  // moves across a chunk boundary, not when moving position
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
          this.chunksManager.generateChunk({ x, y, z }, (chunkMesh) => {
            for (const mesh of chunkMesh) {
              this.scene.add(mesh);
            }
          });
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
        const removedMeshes = this.chunksManager.removeChunk(chunk.getId());

        // remove the chunk meshes from the scene
        for (const mesh of removedMeshes) {
          if (mesh) {
            this.scene.remove(mesh);
          }
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

  private roundToNearestHorizontalChunk(val: number) {
    return Math.round(val / Chunk.WIDTH) * Chunk.WIDTH;
  }

  private roundToNearestVerticalChunk(val: number) {
    return Math.round(val / Chunk.HEIGHT) * Chunk.HEIGHT;
  }
}
