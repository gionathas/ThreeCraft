import { SEA_LEVEL, TERRAIN_OPTIMIZATION_ENABLED } from "../config/constants";
import TerrainMap from "../noise/TerrainMap";
import { BlockFace, BlockType, BlockUtils } from "../terrain/Block";
import { ChunkID, ChunkModel } from "../terrain/Chunk";
import { Coordinate } from "./helpers";

export default class ChunkUtils {
  static coordinateAsChunkId({ x, y, z }: Coordinate): ChunkID {
    return `${x},${y},${z}`;
  }

  static chunkIdAsCoordinate(chunkID: ChunkID): Coordinate {
    const [x, y, z] = chunkID.split(",").map((val) => Number(val));
    return { x, y, z };
  }

  static getChunkIdNeighbour(chunkID: ChunkID, neighbour: "left" | "right") {
    const { x, y, z } = ChunkUtils.chunkIdAsCoordinate(chunkID);

    switch (neighbour) {
      case "left":
        return ChunkUtils.coordinateAsChunkId({ x: x - 1, y, z });
      case "right":
        return ChunkUtils.coordinateAsChunkId({ x: x + 1, y, z });
    }
  }

  /**
   * Return the chunkID of the chunk that is supposed to contain the specified position
   *
   * e.g. if we ask for the coordinates (35,0,0) which is located in the chunk with id (1,0,0)
   * its corresponding chunk id will be "1,0,0".
   */
  static computeChunkIdFromPosition(
    { x, y, z }: Coordinate,
    chunkWidth: number,
    chunkHeight: number
  ): ChunkID {
    const chunkX = Math.floor(x / chunkWidth);
    const chunkY = Math.floor(y / chunkHeight);
    const chunkZ = Math.floor(z / chunkWidth);

    return ChunkUtils.coordinateAsChunkId({
      x: chunkX,
      y: chunkY,
      z: chunkZ,
    });
  }

  /**
   * Compute the chunk origin position from the its chunk id
   *
   * e.g. if we ask for the chunkId (1,0,0) with a chunkWidth and chunkHeight of 32,
   * we will get back the chunkId (32,0,0)
   */
  static computeChunkAbsolutePosition(
    chunkID: ChunkID,
    chunkWidth: number,
    chunkHeight: number
  ): Coordinate {
    const {
      x: chunkX,
      y: chunkY,
      z: chunkZ,
    } = ChunkUtils.chunkIdAsCoordinate(chunkID);

    const offsetStartX = chunkX * chunkWidth;
    const offsetStartY = chunkY * chunkHeight;
    const offsetStartZ = chunkZ * chunkWidth;

    return { x: offsetStartX, y: offsetStartY, z: offsetStartZ };
  }

  static computeChunkGeometry(
    { x: startX, y: startY, z: startZ }: Coordinate,
    chunk: ChunkModel,
    chunkWidth: number,
    chunkHeight: number,
    terrainMap: TerrainMap
  ) {
    const soldidPositions: number[] = [];
    const solidNormals: number[] = [];
    const solidIndices: number[] = [];
    const solidUVs: number[] = [];
    const solidAo: number[] = [];

    const transparentPositions: number[] = [];
    const transparentNormals: number[] = [];
    const transparentIndices: number[] = [];
    const transparentUVs: number[] = [];
    const transparentAo: number[] = [];

    // iterate over each block
    for (let y = 0; y < chunkHeight; ++y) {
      const blockY = startY + y;
      for (let z = 0; z < chunkWidth; ++z) {
        const blockZ = startZ + z;
        for (let x = 0; x < chunkWidth; ++x) {
          const blockX = startX + x;

          const block = chunk.getBlock({ x: blockX, y: blockY, z: blockZ });
          const isVisibleBlock = BlockUtils.isVisibleBlock(block?.type);

          if (block && isVisibleBlock) {
            const isTransparentBlock = block.isTransparent;
            const isWater = block.type === BlockType.WATER;

            // hack to render the water as plane
            if (isWater && blockY !== SEA_LEVEL - 1) {
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
            const aos = isTransparentBlock ? transparentAo : solidAo;

            // iterate over each face of this block
            for (const blockFace of BlockUtils.getBlockFaces()) {
              // hack
              if (isWater && blockFace !== "top") {
                continue;
              }

              const { normal: dir, vertices } =
                BlockUtils.getBlockFaceGeometry(blockFace);

              // let's check the block neighbour to this face of the block
              const neighbourX = blockX + dir[0];
              const neighbourY = blockY + dir[1];
              const neighbourZ = blockZ + dir[2];

              const neighbourBlock = chunk.getBlock({
                x: neighbourX,
                y: neighbourY,
                z: neighbourZ,
              });

              const neighbourSurfaceHeight = terrainMap.getSurfaceHeight(
                neighbourX,
                neighbourZ
              );

              const terrainOptimization = TERRAIN_OPTIMIZATION_ENABLED;
              const isEdgeBlock = !neighbourBlock;
              const isBelowNeighbourSurface =
                blockY < neighbourSurfaceHeight - (blockFace === "top" ? 1 : 0);

              // this will prevent all the underneath blocks to be rendered
              if (
                terrainOptimization &&
                isEdgeBlock &&
                isBelowNeighbourSurface
              ) {
                continue;
              }

              const isNeighbourTransparent = neighbourBlock?.isTransparent;

              let vertexAos = [];

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

                  // add normal for this corner
                  normals.push(...dir);

                  const textureCoords = BlockUtils.getBlockUVCoordinates(
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
                    blockFace,
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
        aos: solidAo,
      },
      transparent: {
        positions: transparentPositions,
        normals: transparentNormals,
        indices: transparentIndices,
        uvs: transparentUVs,
        aos: transparentAo,
      },
    };
  }

  private static computeVertexAO(
    { x, y, z }: Coordinate,
    blockFace: BlockFace,
    {
      side0,
      side1,
      side2,
    }: {
      side0: [number, number, number];
      side1: [number, number, number];
      side2: [number, number, number];
    },
    chunk: ChunkModel
  ) {
    const aoIntensity = 0.8;
    let rgb = 1.0;

    if (blockFace === "top") {
      const t0 = chunk.getBlock({
        x: x + side0[0],
        y: y + side0[1],
        z: z + side0[2],
      });

      if (t0 && BlockUtils.isVisibleBlock(t0.type)) {
        rgb *= aoIntensity;
      }

      const t1 = chunk.getBlock({
        x: x + side1[0],
        y: y + side1[1],
        z: z + side1[2],
      });

      if (t1 && BlockUtils.isVisibleBlock(t1.type)) {
        rgb *= aoIntensity;
      }

      const t2 = chunk.getBlock({
        x: x + side2[0],
        y: y + side2[1],
        z: z + side2[2],
      });

      if (t2 && BlockUtils.isVisibleBlock(t2.type)) {
        rgb *= aoIntensity;
      }
    }

    return [rgb, rgb, rgb];
  }
}
