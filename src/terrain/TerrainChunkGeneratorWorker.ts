import { expose, Transfer } from "threads/worker";
import ChunkUtils from "../utils/ChunkUtils";
import Chunk, { ChunkID } from "./Chunk";
import TerrainChunkGenerator from "./TerrainChunkGenerator";

function generateTerrainChunk(
  chunkId: ChunkID,
  seed: string,
  chunkWidth: number,
  chunkHeight: number
) {
  const chunkGenerator = new TerrainChunkGenerator(seed);

  const {
    x: chunkX,
    y: chunkY,
    z: chunkZ,
  } = ChunkUtils.computeChunkAbsolutePosition(chunkId, chunkWidth, chunkHeight);

  // create the chunk
  const chunk = new Chunk(chunkId, chunkWidth, chunkHeight);

  // apply the terrain
  chunkGenerator.fillTerrain(chunk, chunkX, chunkY, chunkZ);
  const chunkBlocks = chunk.getBlocks();

  const { solid, transparent } = chunk.computeGeometryData({
    x: chunkX,
    y: chunkY,
    z: chunkZ,
  });

  return {
    solidGeometry: solid,
    transparentGeometry: transparent,
    blocksBuffer: Transfer(chunkBlocks.buffer),
  };
}

export type TerrainGeneratorType = typeof generateTerrainChunk;

expose(generateTerrainChunk);
