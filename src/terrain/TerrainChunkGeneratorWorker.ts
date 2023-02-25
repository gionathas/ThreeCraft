import { TransferDescriptor } from "threads";
import { expose, Transfer } from "threads/worker";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../config/constants";
import TerrainShapeMap from "../maps/TerrainShapeMap";
import TreeMapBuilder from "../maps/tree/TreeMapBuilder";
import ChunkUtils from "../utils/ChunkUtils";
import Chunk, { ChunkID } from "./Chunk";
import ChunkGeometry from "./ChunkGeometry";
import TerrainChunkDecorator from "./TerrainChunkDecorator";

function generateChunk(
  chunkId: ChunkID,
  seed: string,
  treeMapDataBuffer: TransferDescriptor<number>
) {
  const start = performance.now();
  const terrainShapeMap = new TerrainShapeMap(seed);

  const treeMap = TreeMapBuilder.generateChunkTreeMapFromBuffer(
    chunkId,
    //@ts-ignore
    new Uint16Array(treeMapDataBuffer),
    seed,
    terrainShapeMap.getHeightMap()
  );

  const chunkOrigin = ChunkUtils.computeChunkWorldOriginPosition(
    chunkId,
    CHUNK_WIDTH,
    CHUNK_HEIGHT
  );

  const chunkDecorator = new TerrainChunkDecorator(terrainShapeMap, treeMap);

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
    terrainShapeMap
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

export type TerrainGeneratorType = typeof generateChunk;

expose(generateChunk);
