import * as THREE from "three";
import Engine from "../core/Engine";
import GlobalMapManager from "../maps/GlobalMapManager";
import TerrainMap from "../maps/TerrainMap";
import { BlockType } from "../terrain/block";
import { ChunkLoader, ChunkManager } from "../terrain/chunk";
import World from "../terrain/World";
import { Coordinate } from "../utils/helpers";

export default class Terrain {
  private scene: THREE.Scene;

  private chunksManager: ChunkManager;
  private chunksLoader: ChunkLoader;

  private globalMapManager: GlobalMapManager;
  private terrainMap: TerrainMap;

  constructor(centerPosition: THREE.Vector3) {
    this.scene = Engine.getInstance().getScene();

    //FIXME
    const seed = "seed";
    this.globalMapManager = GlobalMapManager.getInstance(seed);
    this.terrainMap = this.globalMapManager.getTerrainMap();

    this.chunksManager = new ChunkManager(this.globalMapManager);
    this.chunksLoader = new ChunkLoader(centerPosition, this.chunksManager);
  }

  update(newCenterPosition: THREE.Vector3, isFirstUpdate: boolean = false) {
    this.chunksLoader.update(newCenterPosition, isFirstUpdate);

    // this.globalMapManager._logTotalRegionCount();
  }

  setBlock(blockCoord: Coordinate, block: BlockType) {
    const chunkId = World.getChunkIdFromPosition(blockCoord);

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

  get _totalSolidMesh() {
    return this.chunksManager.totalSolidChunksMesh;
  }

  get _totalTransparentMesh() {
    return this.chunksManager.totalTransparentChunksMesh;
  }

  get _poolSolidMeshSize() {
    return this.chunksManager._poolSolidMeshSize;
  }

  get _poolTransparentMeshSize() {
    return this.chunksManager._poolTransparentMeshSize;
  }
}
