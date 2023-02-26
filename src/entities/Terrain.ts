import * as THREE from "three";
import Engine from "../core/Engine";
import TerrainShapeMap from "../maps/TerrainShapeMap";
import { GlobalTreeMap } from "../maps/tree";
import { BlockType } from "../terrain/block";
import { Chunk, ChunkLoader, ChunkManager } from "../terrain/chunk";
import { Coordinate } from "../utils/helpers";

export default class Terrain {
  private scene: THREE.Scene;

  private chunksManager: ChunkManager;
  private chunksLoader: ChunkLoader;

  private seed: string;
  private terrainShapeMap: TerrainShapeMap;
  private treeMap: GlobalTreeMap;

  constructor(centerPosition: THREE.Vector3) {
    this.scene = Engine.getInstance().getScene();

    this.seed = "seed"; //FIXME
    this.terrainShapeMap = new TerrainShapeMap(this.seed);
    this.treeMap = new GlobalTreeMap(
      this.seed,
      this.terrainShapeMap.getHeightMap()
    );

    this.chunksManager = new ChunkManager(this.terrainShapeMap, this.treeMap);
    this.chunksLoader = new ChunkLoader(centerPosition, this.chunksManager);
  }

  update(newCenterPosition: THREE.Vector3, isFirstUpdate: boolean = false) {
    this.chunksLoader.update(newCenterPosition, isFirstUpdate);
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
