import { Vector3 } from "three";
import Game from "../core/Game";
import GameScene from "../core/GameScene";
import GlobalMapManager from "../maps/GlobalMapManager";
import { TerrainMap } from "../maps/terrain";
import GlobalTreeMap from "../maps/tree/GlobalTreeMap";
import TerrainLoader from "../terrain/TerrainLoader";
import World from "../terrain/World";
import { BlockType } from "../terrain/block";
import { Chunk } from "../terrain/chunk";
import ChunkManager from "../terrain/chunk/ChunkManager";
import Logger from "../tools/Logger";
import { Coordinate } from "../utils/helpers";

export default class Terrain {
  private scene: GameScene;

  private seed: string;

  private chunksManager: ChunkManager;
  private terrainLoader: TerrainLoader;

  private globalMapManager: GlobalMapManager;
  private terrainMap: TerrainMap;
  private treeMap: GlobalTreeMap;

  constructor(seed: string, renderDistanceInChunks: number) {
    this.scene = Game.instance().getScene();
    this.seed = seed;

    this.globalMapManager = GlobalMapManager.getInstance(seed);
    this.terrainMap = this.globalMapManager.getTerrainMap();
    this.treeMap = this.globalMapManager.getTreeMap();

    this.chunksManager = new ChunkManager(this.globalMapManager);
    this.terrainLoader = new TerrainLoader(
      this.chunksManager,
      renderDistanceInChunks
    );
  }

  async init(isAsync: boolean, initialOrigin?: Vector3) {
    const logPrefix = isAsync ? "ASYNC" : "SYNC";
    Logger.info(`Initializing terrain (${logPrefix})...`, Logger.INIT_KEY);

    const origin = initialOrigin ?? World.ORIGIN;
    Logger.debug(
      `Terrain origin: ${initialOrigin?.toArray()}`,
      Logger.TERRAIN_KEY
    );

    if (isAsync) {
      await this.asyncInit(origin);
    } else {
      this.syncInit(origin);
    }
  }

  private async asyncInit(origin: Vector3) {
    await this.terrainLoader.asyncInit(origin);
  }

  private syncInit(origin: Vector3) {
    this.terrainLoader.init(origin);
  }

  update(newOrigin: THREE.Vector3) {
    this.terrainLoader.update(newOrigin);

    // this.globalMapManager._logTotalRegionCount();
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
      this.chunksManager.updateChunkAt(blockCoord);

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

  dispose() {
    Logger.info("Disposing terrain...", Logger.DISPOSE_KEY);
    // dispose all the chunks
    this.chunksManager.dispose();

    // dispose all the global maps
    this.globalMapManager.dispose();
    Logger.info("Terrain disposed!", Logger.DISPOSE_KEY);
  }

  setRenderDistance(renderDistanceInChunks: number) {
    this.terrainLoader.setRenderDistance(renderDistanceInChunks);
  }

  isSolidBlock(blockCoord: Coordinate): boolean {
    const block = this.getBlock(blockCoord);

    return block ? block.isSolid : false;
  }

  getBlock(blockCoord: Coordinate) {
    return this.chunksManager.getBlock(blockCoord);
  }

  getSurfaceHeight(x: number, z: number) {
    return this.terrainMap.getSurfaceHeightAt(x, z);
  }

  hasTreeAt(x: number, z: number) {
    return this.treeMap.hasTreeAt(x, z);
  }

  getSeed() {
    return this.seed;
  }

  _getContinentalness(x: number, z: number) {
    return this.terrainMap.getContinentalnessAt(x, z);
  }

  _getErosion(x: number, z: number) {
    return this.terrainMap.getErosionAt(x, z);
  }

  _getPV(x: number, z: number) {
    return this.terrainMap.getPVAt(x, z);
  }

  get _totalChunks() {
    return this.chunksManager.totalChunks;
  }

  get _solidMeshPoolSize() {
    return this.chunksManager._solidMeshPoolSize;
  }

  get _transparentMeshPoolSize() {
    return this.chunksManager._transparentMeshPoolSize;
  }
}
