import EnvVars from "../config/EnvVars";
import Game from "../core/Game";
import GameScene from "../core/GameScene";
import { Coordinate } from "../utils/helpers";
import Chunk, { ChunkID } from "./chunk/Chunk";
import ChunkManager from "./chunk/ChunkManager";
import World from "./World";

type TerrainBoundaries = {
  lowerX: number;
  upperX: number;
  lowerY: number;
  upperY: number;
  lowerZ: number;
  upperZ: number;
};

export default class TerrainLoader {
  private scene: GameScene;
  private chunksManager: ChunkManager;

  private prevCenterChunk?: ChunkID;
  private hozRenderDistance: number;

  constructor(chunksManager: ChunkManager, renderDistanceInChunks: number) {
    this.scene = Game.instance().getScene();
    this.chunksManager = chunksManager;
    this.hozRenderDistance = renderDistanceInChunks * Chunk.WIDTH;
  }

  async asyncInit(centerPosition: THREE.Vector3) {
    const terrainBoundaries =
      this.getTerrainBoundariesFromPosition(centerPosition);

    const tasks = this.loadTerrain(terrainBoundaries);
    await Promise.all(tasks);
    this.prevCenterChunk = Chunk.getChunkIdFromPosition(centerPosition);
  }

  init(centerPosition: THREE.Vector3) {
    const terrainBoundaries =
      this.getTerrainBoundariesFromPosition(centerPosition);

    this.loadTerrain(terrainBoundaries);
    this.prevCenterChunk = Chunk.getChunkIdFromPosition(centerPosition);
  }

  update(centerPosition: THREE.Vector3) {
    const isGenerationEnabled = EnvVars.TERRAIN_GENERATION_ENABLED;

    const currCenterChunk = Chunk.getChunkIdFromPosition(centerPosition);
    const isSameChunk = this.prevCenterChunk === currCenterChunk;

    if (!isSameChunk && isGenerationEnabled) {
      const terrainBoundaries =
        this.getTerrainBoundariesFromPosition(centerPosition);

      this.unloadTerrain(terrainBoundaries);
      this.loadTerrain(terrainBoundaries);
      this.prevCenterChunk = currCenterChunk;

      // console.log(`solidPool: ${this.chunksManager._poolSolidMeshSize}`);
      // console.log(`transPool: ${this.chunksManager._poolTransparentMeshSize}`);
    }
  }

  //TODO optimization: instead of doing a 3 nested loop every frame,
  // to detect the new chunk to load (except for the initial terrain generation),
  // we can implement a diff between the previous terrain boundaries and the current boundaries
  // to find the chunk that needs to be loaded
  private loadTerrain(boundaries: TerrainBoundaries) {
    const tasks = [];

    const { lowerX, upperX, lowerY, upperY, lowerZ, upperZ } = boundaries;
    for (let x = lowerX; x < upperX; x += Chunk.WIDTH) {
      for (let z = lowerZ; z < upperZ; z += Chunk.WIDTH) {
        for (let y = upperY; y > lowerY; y -= Chunk.HEIGHT) {
          const task = this.chunksManager.generateChunkAt(
            { x, y, z },
            (chunkMesh) => {
              for (const mesh of chunkMesh) {
                this.scene.add(mesh);
              }
            }
          );

          tasks.push(task);
        }
      }
    }

    return tasks;
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

    const lowerX = centerChunkOriginX - this.hozRenderDistance;
    const upperX = centerChunkOriginX + this.hozRenderDistance;

    const upperZ = centerChunkOriginZ + this.hozRenderDistance;
    const lowerZ = centerChunkOriginZ - this.hozRenderDistance;

    const upperY = World.MAX_WORLD_HEIGHT;
    const lowerY = World.MIN_WORLD_HEIGHT;

    return { lowerX, upperX, lowerY, upperY, lowerZ, upperZ };
  }

  private roundToNearestHorizontalChunk(val: number) {
    return Math.round(val / Chunk.WIDTH) * Chunk.WIDTH;
  }

  private roundToNearestVerticalChunk(val: number) {
    return Math.round(val / Chunk.HEIGHT) * Chunk.HEIGHT;
  }

  setRenderDistance(renderDistanceInChunks: number) {
    this.hozRenderDistance = renderDistanceInChunks * Chunk.WIDTH;
  }
}
