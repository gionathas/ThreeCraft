import { BufferAttribute, BufferGeometry, Mesh } from "three";
import { BufferGeometryData } from "../../utils/helpers";
import BlockMaterial from "../block/BlockMaterial";
import { ChunkID } from "./Chunk";

// WARN this value seems to affect the memory usage, keep it as low as possible
const MAX_SOLID_MESH_POOL_SIZE = 200;
const MAX_TRANSPARENT_MESH_POOL_SIZE = 50;

/**
 * This class is responsible for generating the chunk meshes
 *
 * It uses a pool of meshes to avoid creating new meshes every time a chunk is generated
 */
export default class ChunkMeshManager {
  private readonly POSITION_NUM_COMPONENTS = 3;
  private readonly NORMAL_NUM_COMPONENTS = 3;
  private readonly UV_NUM_COMPONENTS = 2;
  private readonly COLOR_NUM_COMPONENTS = 3;

  private solidMesh: Map<ChunkID, THREE.Mesh>;
  private transparentMesh: Map<ChunkID, THREE.Mesh>;
  private solidMeshPool: Array<THREE.Mesh>;
  private transparentMeshPool: Array<THREE.Mesh>;
  private blockMaterials: BlockMaterial;

  constructor() {
    this.solidMesh = new Map();
    this.transparentMesh = new Map();
    this.solidMeshPool = [];
    this.transparentMeshPool = [];
    this.blockMaterials = BlockMaterial.getInstance();
  }

  generateChunkSolidMesh(
    chunkId: ChunkID,
    { positions, normals, uvs, indices, colors }: BufferGeometryData
  ) {
    const {
      POSITION_NUM_COMPONENTS,
      NORMAL_NUM_COMPONENTS,
      UV_NUM_COMPONENTS,
      COLOR_NUM_COMPONENTS,
    } = this;

    const chunkMesh = this.getNewSolidMesh(chunkId);
    const chunkGeometry = chunkMesh.geometry;

    // update chunk geometry attributes
    chunkGeometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), POSITION_NUM_COMPONENTS)
    );
    chunkGeometry.setAttribute(
      "normal",
      new BufferAttribute(new Float32Array(normals), NORMAL_NUM_COMPONENTS)
    );
    chunkGeometry.setAttribute(
      "uv",
      new BufferAttribute(new Float32Array(uvs), UV_NUM_COMPONENTS)
    );
    chunkGeometry.setAttribute(
      "color",
      new BufferAttribute(new Float32Array(colors), COLOR_NUM_COMPONENTS)
    );

    chunkGeometry.setIndex(indices);
    chunkGeometry.computeBoundingSphere();

    // update the chunk mesh name and add it to chunks mesh map
    chunkMesh.name = this.getChunkSolidMeshId(chunkId);
    this.solidMesh.set(chunkId, chunkMesh);

    return chunkMesh;
  }

  generateChunkTransparentMesh(
    chunkId: ChunkID,
    { positions, normals, uvs, indices }: BufferGeometryData
  ) {
    const {
      POSITION_NUM_COMPONENTS: positionNumComponents,
      NORMAL_NUM_COMPONENTS: normalNumComponents,
      UV_NUM_COMPONENTS: uvNumComponents,
    } = this;

    const transparentMesh = this.getNewTransparentMesh(chunkId);
    const chunkGeometry = transparentMesh.geometry;

    // update chunk geometry attributes
    chunkGeometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), positionNumComponents)
    );
    chunkGeometry.setAttribute(
      "normal",
      new BufferAttribute(new Float32Array(normals), normalNumComponents)
    );
    chunkGeometry.setAttribute(
      "uv",
      new BufferAttribute(new Float32Array(uvs), uvNumComponents)
    );

    chunkGeometry.setIndex(indices);
    chunkGeometry.computeBoundingSphere();

    // update the chunk mesh name and add it to chunks mesh map
    transparentMesh.name = this.getChunkTransparentMeshId(chunkId);
    this.transparentMesh.set(chunkId, transparentMesh);

    return transparentMesh;
  }

  dispose() {
    this.solidMesh.forEach((mesh) => {
      mesh.geometry.dispose();
      // @ts-ignore
      mesh.material.dispose();
    });

    this.transparentMesh.forEach((mesh) => {
      mesh.geometry.dispose();
      // @ts-ignore
      mesh.material.dispose();
    });

    this.solidMesh.clear();
    this.transparentMesh.clear();
    this.solidMeshPool.length = 0;
    this.transparentMeshPool.length = 0;
    this.blockMaterials.dispose();
  }

  /**
   * Return the chunk mesh associated to the chunkID.
   *
   * If the mesh does not exist it will try either to extract one from the mesh pool,
   * or it will creates a new one
   */
  private getNewSolidMesh(chunkID: ChunkID): THREE.Mesh {
    const prevSolidMesh = this.solidMesh.get(chunkID);

    // if the mesh for the chunkId already exist return it
    if (prevSolidMesh) {
      return prevSolidMesh;
    }

    // extract the mesh from the pool
    let newMesh = this.solidMeshPool.pop();

    // pool is empty create a new mesh
    if (!newMesh) {
      const solidMaterial = this.blockMaterials.getBlockSolidMaterial();
      newMesh = new Mesh(new BufferGeometry(), solidMaterial);
    }

    return newMesh;
  }

  /**
   * Return the chunk mesh associated to the chunkID.
   *
   * If the mesh does not exist it will try either to extract one from the mesh pool,
   * or it will creates a new one
   */
  private getNewTransparentMesh(chunkID: ChunkID): THREE.Mesh {
    const prevTransparentMesh = this.transparentMesh.get(chunkID);

    // if the mesh for the chunkId already exist return it
    if (prevTransparentMesh) {
      return prevTransparentMesh;
    }

    // extract the mesh from the pool
    let newMesh = this.transparentMeshPool.pop();

    if (!newMesh) {
      const transparentMaterial =
        this.blockMaterials.getBlockTransparentMaterial();
      newMesh = new Mesh(new BufferGeometry(), transparentMaterial);
    }

    return newMesh;
  }

  removeChunkSolidMesh(chunkId: ChunkID) {
    const solidMesh = this.solidMesh.get(chunkId);

    // remove chunk solid mesh
    if (solidMesh) {
      // remove from the chunks mesh map
      this.solidMesh.delete(chunkId);

      // let's reuse this mesh if the pool is not filled up
      if (this.solidMeshPool.length <= MAX_SOLID_MESH_POOL_SIZE) {
        this.solidMeshPool.push(solidMesh);
      } else {
        // dispose the mesh
        solidMesh.geometry.dispose();
      }
    }

    return solidMesh;
  }

  removeChunkTransparentMesh(chunkId: ChunkID) {
    const transparentMesh = this.transparentMesh.get(chunkId);

    // remove chunk transparent mesh
    if (transparentMesh) {
      // remove from the chunks mesh map
      this.transparentMesh.delete(chunkId);

      // let's reuse this mesh if the pool is not filled up
      if (this.transparentMeshPool.length <= MAX_TRANSPARENT_MESH_POOL_SIZE) {
        this.transparentMeshPool.push(transparentMesh);
      } else {
        // dispose the mesh
        transparentMesh.geometry.dispose();
      }
    }

    return transparentMesh;
  }

  getSolidChunkMesh(chunkId: ChunkID) {
    return this.solidMesh.get(chunkId);
  }

  getTransparentChunkMesh(chunkId: ChunkID) {
    return this.transparentMesh.get(chunkId);
  }

  private getChunkSolidMeshId(chunkId: ChunkID) {
    return chunkId.concat("_solid");
  }

  private getChunkTransparentMeshId(chunkId: ChunkID) {
    return chunkId.concat("_transparent");
  }

  get _solidMeshPoolSize() {
    return this.solidMeshPool.length;
  }

  get _transparentMeshPoolSize() {
    return this.transparentMeshPool.length;
  }

  get _solidMeshCount() {
    return this.solidMesh.size;
  }

  get _transparentMeshCount() {
    return this.transparentMesh.size;
  }
}
