import { expose, Transfer } from "threads/worker";
import ChunkUtils from "../utils/ChunkUtils";
import { Coordinate } from "../utils/helpers";
import Chunk from "./Chunk";
import TerrainChunkGenerator from "./TerrainChunkGenerator";

function generateTerrainChunk(
  chunkCoord: Coordinate,
  chunkWidth: number,
  chunkHeight: number
) {
  const chunkGenerator = new TerrainChunkGenerator();

  const { x, y, z } = chunkCoord;
  const chunkID = ChunkUtils.computeChunkIdFromPosition(
    chunkCoord,
    chunkWidth,
    chunkHeight
  );

  const {
    x: chunkX,
    y: chunkY,
    z: chunkZ,
  } = ChunkUtils.computeChunkOriginPosition(chunkID, chunkWidth, chunkHeight);

  // create the chunk
  const chunk = new Chunk(chunkID, chunkWidth, chunkHeight);

  // apply the terrain
  chunkGenerator.fillTerrain(chunk, x, y, z);
  const chunkBlocks = chunk.getBlocks();

  const { solid, transparent } = chunk.computeGeometryData({
    x: chunkX,
    y: chunkY,
    z: chunkZ,
  });

  return {
    chunkID,
    solidGeometry: solid,
    transparentGeometry: transparent,
    blocksBuffer: Transfer(chunkBlocks.buffer),
  };
}

export type TerrainGeneratorType = typeof generateTerrainChunk;

expose(generateTerrainChunk);
