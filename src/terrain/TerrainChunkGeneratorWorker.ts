import { expose, Transfer } from "threads/worker";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../config/constants";
import WorldMap from "../noise/WorldMap";
import ChunkUtils from "../utils/ChunkUtils";
import Chunk, { ChunkID } from "./Chunk";
import ChunkGeometry from "./ChunkGeometry";
import TerrainChunkDecorator from "./TerrainChunkDecorator";

function generateTerrainChunk(chunkId: ChunkID, seed: string) {
  const start = performance.now();
  const worldMap = new WorldMap(seed);
  const chunkDecorator = new TerrainChunkDecorator(worldMap);

  const chunkOrigin = ChunkUtils.computeChunkAbsolutePosition(
    chunkId,
    CHUNK_WIDTH,
    CHUNK_HEIGHT
  );

  // create the chunk
  const chunk = new Chunk(chunkId, CHUNK_WIDTH, CHUNK_HEIGHT);

  // apply the terrain
  chunkDecorator.fillChunk(chunk, chunkOrigin);
  const chunkBlocks = chunk.getBlocks();

  const { solid, transparent } = ChunkGeometry.computeChunkGeometry(
    chunkOrigin,
    chunk,
    CHUNK_WIDTH,
    CHUNK_HEIGHT,
    worldMap
  );

  const end = performance.now();
  const time = (end - start) / 1000;

  return {
    solidGeometry: solid,
    transparentGeometry: transparent,
    blocksBuffer: Transfer(chunkBlocks.buffer),
    time,
  };
}

export type TerrainGeneratorType = typeof generateTerrainChunk;

expose(generateTerrainChunk);
