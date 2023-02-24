import { TransferDescriptor } from "threads";
import { expose, Transfer } from "threads/worker";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "../config/constants";
import SharedTreeMap from "../maps/SharedTreeMap";
import TerrainShapeMap from "../maps/TerrainShapeMap";
import TreeMap from "../maps/TreeMap";
import ChunkUtils from "../utils/ChunkUtils";
import Chunk, { ChunkID } from "./Chunk";
import ChunkGeometry from "./ChunkGeometry";
import TerrainChunkDecorator from "./TerrainChunkDecorator";

function generateTerrainChunk(
  chunkId: ChunkID,
  seed: string,
  treeMapDataBuffer: TransferDescriptor<any>
) {
  const start = performance.now();
  const terrainShapeMap = new TerrainShapeMap(seed);

  const chunkOrigin = ChunkUtils.computeChunkWorldOriginPosition(
    chunkId,
    CHUNK_WIDTH,
    CHUNK_HEIGHT
  );

  //TODO extract loader class
  const treeMap = new TreeMap(seed, terrainShapeMap.getHeightMap());
  const treeMapData = SharedTreeMap.convertChunkBufferDataToMapData(
    chunkId,
    //@ts-ignore
    new Uint8Array(treeMapDataBuffer)
  );
  treeMap.setData(treeMapData);

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

export type TerrainGeneratorType = typeof generateTerrainChunk;

expose(generateTerrainChunk);
