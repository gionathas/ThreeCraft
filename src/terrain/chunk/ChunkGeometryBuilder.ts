import EnvVars from "../../config/EnvVars";
import DensityMap from "../../maps/DensityMap";
import TerrainShapeMap from "../../maps/TerrainShapeMap";
import { Coordinate } from "../../utils/helpers";
import { Block, BlockData, BlockFaceAO, BlockType } from "../block";
import { BlockFace } from "../block/BlockGeometry";
import World from "../World";
import Chunk, { ChunkModel } from "./Chunk";

//TODO - refactor this class
// add internal state to this class
// - move the block face rendering optimization logic to BlockFaceRenderer
export default class ChunkGeometryBuilder {
  private static readonly AO_INTENSITY_LEVEL = [1.0, 0.8, 0.7, 0.6];

  static buildChunkGeometry(
    chunk: ChunkModel,
    chunkOrigin: Coordinate,
    terrainShapeMap: TerrainShapeMap,
    densityMap: DensityMap
  ) {
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

          const block = chunk.getBlock({ x: blockX, y: blockY, z: blockZ });
          const isVisibleBlock = Block.isVisibleBlock(block?.type);

          if (block && isVisibleBlock) {
            const isTransparentBlock = block.isTransparent;
            const isWater = block.type === BlockType.WATER;

            // hack to render only the surface water blocks
            if (isWater && this.shouldSkipWaterBlockRendering(blockY)) {
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
              // hack
              if (isWater && blockFace !== "top") {
                continue;
              }

              const { normal: dir, vertices } =
                Block.getBlockFaceGeometry(blockFace);

              // let's check the block neighbour to this face of the block
              const neighbourX = blockX + dir[0];
              const neighbourY = blockY + dir[1];
              const neighbourZ = blockZ + dir[2];

              const neighbourBlock = chunk.getBlock({
                x: neighbourX,
                y: neighbourY,
                z: neighbourZ,
              });

              const neighbourSurfaceY = terrainShapeMap.getSurfaceHeightAt(
                neighbourX,
                neighbourZ
              );

              const blockDensity = densityMap.getDensityAt(
                blockX,
                blockY,
                blockZ
              );
              const neighbourDensity = densityMap.getDensityAt(
                neighbourX,
                neighbourY,
                neighbourZ
              );

              if (
                this.isBlockFaceRenderingOptimizable(
                  { x: blockX, y: blockY, z: blockZ },
                  blockDensity,
                  blockFace,
                  neighbourBlock,
                  neighbourDensity,
                  neighbourSurfaceY
                )
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
                  const vertexX = pos[0] + blockX;
                  const vertexY = pos[1] + blockY;
                  const vertexZ = pos[2] + blockZ;

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
                    chunk,
                    terrainShapeMap,
                    densityMap
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
   * This function compute the ambient occlusion for a particular vertex of a block face.
   *
   * It will return an rgb value representing how much occluded the vertex is, from no occlusion
   * (1.0, 1.0, 1.0) to maximal occlusion (0.7, 0.7, 0.7)
   *
   * //TODO fix ambient occlusion asintropy issue
   */
  private static computeVertexAO(
    { x, y, z }: Coordinate,
    { side0, side1, side2 }: BlockFaceAO,
    chunk: ChunkModel,
    terrainShapeMap: TerrainShapeMap,
    densityMap: DensityMap
  ) {
    // const aoIntensity = [1.0, 0.6, 0.5, 0.4];

    let occlusionLevel = 0;
    for (const occlusionSide of [side0, side1, side2]) {
      if (
        this.isSideOccluded(
          { x, y, z },
          occlusionSide,
          chunk,
          terrainShapeMap,
          densityMap
        )
      ) {
        occlusionLevel += 1;
      }
    }

    const rgb = this.AO_INTENSITY_LEVEL[occlusionLevel];
    return [rgb, rgb, rgb];
  }

  private static isSideOccluded(
    { x, y, z }: Coordinate,
    side: [number, number, number],
    chunk: ChunkModel,
    terrainShapeMap: TerrainShapeMap,
    densityMap: DensityMap
  ) {
    const [dx, dy, dz] = side;

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

      const nearbySurfaceHeight = terrainShapeMap.getSurfaceHeightAt(nx, nz);
      const nearbyDensity = densityMap.getDensityAt(nx, ny, nz);

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

  private static isBlockFaceRenderingOptimizable(
    { y: blockY }: Coordinate,
    blockDensity: number,
    blockFace: BlockFace,
    neighbourBlock: BlockData | null,
    neighbourDensity: number,
    neighbourSurfaceY: number
  ) {
    const terrainOptimization = EnvVars.TERRAIN_OPTIMIZATION_ENABLED;

    if (!terrainOptimization) {
      return false;
    }

    const isEdgeBlock = !neighbourBlock;
    const isBelowNeighbourSurface =
      blockY < neighbourSurfaceY - (blockFace === "top" ? 1 : 0);

    const hasSameDensity =
      Math.sign(blockDensity) === Math.sign(neighbourDensity);

    return isEdgeBlock && isBelowNeighbourSurface && hasSameDensity;
  }

  /**
   * hack to render only the surface water blocks
   */
  private static shouldSkipWaterBlockRendering(y: number) {
    return y !== World.SEA_LEVEL - 1;
  }
}
