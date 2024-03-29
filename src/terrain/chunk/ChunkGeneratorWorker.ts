import { Transfer, TransferDescriptor } from "threads";
import { expose } from "threads/worker";
import WorkerMapManager from "../../maps/WorkerMapManager";
import BlockGeneratorFactory, {
  Phase,
} from "../block/generators/BlockGeneratorFactory";
import Chunk, { ChunkID } from "./Chunk";
import ChunkGeometryBuilder from "./ChunkGeometryBuilder";

function generateChunk(
  chunkId: ChunkID,
  seed: string,
  treeMapDataBuffer: TransferDescriptor<number>
) {
  // create the chunk
  const chunk = new Chunk(chunkId);

  // load maps
  const mapManager = new WorkerMapManager(seed);
  const terrainMap = mapManager.getTerrainMap();
  const treeMap = mapManager.getTreeMapFromBuffer(
    chunkId,
    //@ts-ignore
    new Uint16Array(treeMapDataBuffer)
  );

  // istantiate a block generator factory
  const blockFactory = new BlockGeneratorFactory(terrainMap, treeMap);
  const surfaceGenerator = blockFactory.getBlockGenerator(Phase.TERRAIN);
  const featureGenerator = blockFactory.getBlockGenerator(Phase.FEATURES);

  // apply phase 1
  chunk.decorateChunk(surfaceGenerator);
  // apply phase 2
  chunk.decorateChunk(featureGenerator);

  const chunkBlocks = chunk.getBlocks();

  // build chunk geometry
  const chunkGeometryBuilder = new ChunkGeometryBuilder(terrainMap);

  const { solid, transparent } = chunkGeometryBuilder.buildChunkGeometry(
    chunk,
    chunk.getWorldOriginPosition()
  );

  return {
    solidGeometry: solid,
    transparentGeometry: transparent,
    blocksBuffer: Transfer(chunkBlocks.buffer),
  };
}

export type ChunkGeneratorWorkerType = typeof generateChunk;
expose(generateChunk);
