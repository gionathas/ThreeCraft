import EnvVars from "../../config/EnvVars";
import { TerrainMap } from "../../maps/terrain";
import { BufferGeometryData, Coordinate } from "../../utils/helpers";
import { Block, BlockFaceAO, BlockType } from "../block";
import { BlockFace } from "../block/BlockGeometry";
import World from "../World";
import Chunk, { ChunkModel } from "./Chunk";

export default class ChunkGeometryBuilder {
  private readonly AO_INTENSITY_LEVEL = [1.0, 0.8, 0.7, 0.6];

  private terrainMap: TerrainMap;

  constructor(terrainMap: TerrainMap) {
    this.terrainMap = terrainMap;
  }

  buildChunkGeometry(chunk: ChunkModel, chunkOrigin: Coordinate) {
    const { x: startX, y: startY, z: startZ } = chunkOrigin;

    const soldidPositions: number[] = [];
    const solidNormals: number[] = [];
    const solidIndices: number[] = [];
    const solidUVs: number[] = [];
    const solidAOs: number[] = [];

    const transparentPositions: number[] = [];
    const transparentNormals: number[] = [];
    const transparentIndices: number[] = [];
    const transparentUVs: number[] = [];
    const transparentAOs: number[] = [];

    // iterate over each block
    for (let y = 0; y < Chunk.HEIGHT; ++y) {
      const blockY = startY + y;
      for (let z = 0; z < Chunk.WIDTH; ++z) {
        const blockZ = startZ + z;
        for (let x = 0; x < Chunk.WIDTH; ++x) {
          const blockX = startX + x;

          const blockCoords = { x: blockX, y: blockY, z: blockZ };
          const block = chunk.getBlock(blockCoords);

          const isVisibleBlock = Block.isVisibleBlock(block?.type);

          if (block && isVisibleBlock) {
            const isTransparentBlock = block.isTransparent;
            const isWaterBlock = block.type === BlockType.WATER;

            // hack to render only the surface water blocks
            if (isWaterBlock && this.canSkipWaterBlockRendering(blockY)) {
              continue;
            }

            const positions = isTransparentBlock
              ? transparentPositions
              : soldidPositions;
            const normals = isTransparentBlock
              ? transparentNormals
              : solidNormals;
            const indices = isTransparentBlock
              ? transparentIndices
              : solidIndices;
            const uvs = isTransparentBlock ? transparentUVs : solidUVs;
            const aos = isTransparentBlock ? transparentAOs : solidAOs;

            // iterate over each face of this block
            for (const blockFace of Block.getBlockFaces()) {
              // hack to render only the surface of water blocks
              if (isWaterBlock && blockFace !== "top") {
                continue;
              }

              const { normal: dir, vertices } =
                Block.getBlockFaceGeometry(blockFace);

              // let's check the block neighbour to this face of the block
              const neighCoords = {
                x: blockX + dir[0],
                y: blockY + dir[1],
                z: blockZ + dir[2],
              };
              const neighbourBlock = chunk.getBlock(neighCoords);

              const terrainOptimization = EnvVars.TERRAIN_OPTIMIZATION_ENABLED;
              const isEdgeBlock = !neighbourBlock;

              // if the current block is an edge block and terrain optimization is enabled
              // check if we can cull this block face
              if (
                terrainOptimization &&
                isEdgeBlock &&
                this.canCullEdgeBlockFace(blockCoords, blockFace, neighCoords)
              ) {
                continue;
              }

              const isNeighbourTransparent = neighbourBlock?.isTransparent;

              // if the current block has no neighbor or has a transparent neighbour
              // we need to show this block face
              if (!neighbourBlock || isNeighbourTransparent) {
                const ndx = positions.length / 3;

                // for each vertex of the current face
                for (const { pos, uv, ao: aoSides } of vertices) {
                  const vertexX = blockX + pos[0];
                  const vertexY = blockY + pos[1];
                  const vertexZ = blockZ + pos[2];

                  // add vertex position
                  positions.push(vertexX, vertexY, vertexZ);

                  // add vertex normal
                  normals.push(...dir);

                  const textureCoords = Block.getBlockUVCoordinates(
                    block.type,
                    blockFace,
                    [uv[0], uv[1]]
                  );

                  uvs.push(textureCoords.u, textureCoords.v);

                  const vertexAO = this.computeVertexAO(
                    {
                      x: vertexX,
                      y: vertexY,
                      z: vertexZ,
                    },
                    aoSides,
                    chunk
                  );

                  aos.push(...vertexAO);
                }

                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }

    return {
      solid: {
        positions: soldidPositions,
        normals: solidNormals,
        indices: solidIndices,
        uvs: solidUVs,
        aos: solidAOs,
      },
      transparent: {
        positions: transparentPositions,
        normals: transparentNormals,
        indices: transparentIndices,
        uvs: transparentUVs,
        aos: transparentAOs,
      },
    };
  }

  /**
   * Check if the current block face can be culled by doing some checks on the neighbour block
   */
  private canCullEdgeBlockFace(
    blockCoord: Coordinate,
    blockFace: BlockFace,
    neighbourCoords: Coordinate
  ) {
    const { terrainMap } = this;
    const { x: blockX, y: blockY, z: blockZ } = blockCoord;
    const { x: neighbourX, y: neighbourY, z: neighbourZ } = neighbourCoords;

    const neighbourSurfaceY = terrainMap.getSurfaceHeightAt(
      neighbourX,
      neighbourZ
    );

    const isBelowNeighbourSurface =
      blockY < neighbourSurfaceY - (blockFace === "top" ? 1 : 0);

    if (!isBelowNeighbourSurface) {
      return false;
    }

    const blockDensity = terrainMap.getDensityAt(blockX, blockY, blockZ);
    const neighbourDensity = terrainMap.getDensityAt(
      neighbourX,
      neighbourY,
      neighbourZ
    );

    const haveSameDensity =
      Math.sign(blockDensity) === Math.sign(neighbourDensity);

    return haveSameDensity;
  }

  /**
   * This function compute the ambient occlusion for a particular vertex of a block face.
   *
   * It will return an rgb value representing how much occluded the vertex is, from no occlusion
   * (1.0, 1.0, 1.0) to maximal occlusion (0.7, 0.7, 0.7)
   *
   * //TODO fix ambient occlusion asintropy issue
   */
  private computeVertexAO(
    { x, y, z }: Coordinate,
    { side0, side1, side2 }: BlockFaceAO,
    chunk: ChunkModel
  ) {
    let occlusionLevel = 0;

    for (const occlusionSide of [side0, side1, side2]) {
      if (this.isSideOccluded({ x, y, z }, occlusionSide, chunk)) {
        occlusionLevel += 1;
      }
    }

    const rgb = this.AO_INTENSITY_LEVEL[occlusionLevel];
    return [rgb, rgb, rgb];
  }

  private isSideOccluded(
    { x, y, z }: Coordinate,
    aoSide: [number, number, number],
    chunk: ChunkModel
  ) {
    const { terrainMap } = this;
    const [dx, dy, dz] = aoSide;

    const occludingBlock = chunk.getBlock({
      x: x + dx,
      y: y + dy,
      z: z + dz,
    });

    if (occludingBlock && occludingBlock.isSolid) {
      return true;
    }

    // out of the chunk edges, use the surface heigh  t as an heuristic check
    if (!occludingBlock) {
      const nx = Math.floor(x + dx);
      const ny = Math.floor(y + dy);
      const nz = Math.floor(z + dz);

      const nearbySurfaceHeight = terrainMap.getSurfaceHeightAt(nx, nz);
      const nearbyDensity = terrainMap.getDensityAt(nx, ny, nz);

      const isNearbyBlockSolid = Math.sign(nearbyDensity) > 0;

      const isCheckingBlockAbove = Math.sign(dy) > 0;
      const isCheckinBlockBelow = Math.sign(dy) < 0;

      const hasNearbyBlockAbove = y < nearbySurfaceHeight;
      const hasNearbyBlockAtSameYLevel =
        Math.abs(y - nearbySurfaceHeight) === 0;

      // if we are checking a block above us we just a need an higher surface height
      // to get occlusion, whereas if we are checking a block below us we need
      // a surface height which is at the same level of the vertex y coordinate
      if (isNearbyBlockSolid) {
        return (
          (isCheckingBlockAbove && hasNearbyBlockAbove) ||
          (isCheckinBlockBelow && hasNearbyBlockAtSameYLevel)
        );
      }
    }

    return false;
  }

  /**
   * hack to render only the surface water blocks
   */
  private canSkipWaterBlockRendering(y: number) {
    return y !== World.SEA_LEVEL - 1;
  }

  static extractBufferGeometryDataFromGeometry(
    geometry: THREE.BufferGeometry
  ): BufferGeometryData {
    const positions = Array.from(geometry.getAttribute("position").array);
    const normals = Array.from(geometry.getAttribute("normal").array);
    const uvs = Array.from(geometry.getAttribute("uv").array);
    const aos = Array.from(geometry.getAttribute("color")?.array ?? []);
    const indices = Array.from(geometry.index?.array ?? []);

    return {
      positions,
      normals,
      uvs,
      indices,
      aos,
    };
  }
}
