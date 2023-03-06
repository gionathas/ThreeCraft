import { TransferDescriptor } from "threads";
import { expose, Transfer } from "threads/worker";
import DensityMap from "../../maps/DensityMap";
import TerrainShapeMap from "../../maps/TerrainShapeMap";
import { TreeMapBuilder } from "../../maps/tree";
import { BlockGeneratorFactory } from "../block";
import { Phase } from "../block/generators/BlockGeneratorFactory";
import Chunk, { ChunkID } from "./Chunk";
import ChunkGeometryBuilder from "./ChunkGeometryBuilder";

function generateChunk(
  chunkId: ChunkID,
  seed: string,
  treeMapDataBuffer: TransferDescriptor<number>
) {
  const start = performance.now();

  // create the chunk
  const chunk = new Chunk(chunkId);

  // load maps
  const terrainShapeMap = new TerrainShapeMap(seed);
  const densityMap = new DensityMap(terrainShapeMap);
  const treeMap = TreeMapBuilder.generateChunkTreeMapFromBuffer(
    chunkId,
    //@ts-ignore
    new Uint16Array(treeMapDataBuffer),
    terrainShapeMap
  );

  // istantiate a block generator factory
  const blockFactory = new BlockGeneratorFactory(
    terrainShapeMap,
    densityMap,
    treeMap
  );
  const surfaceGenerator = blockFactory.getBlockGenerator(Phase.TERRAIN);
  const featureGenerator = blockFactory.getBlockGenerator(Phase.FEATURES);

  // apply phase 1
  chunk.decorateChunk(surfaceGenerator);
  // apply phase 2
  chunk.decorateChunk(featureGenerator);

  const chunkBlocks = chunk.getBlocks();

  // build chunk geometry
  const chunkGeometryBuilder = new ChunkGeometryBuilder(
    terrainShapeMap,
    densityMap
  );

  const { solid, transparent } = chunkGeometryBuilder.buildChunkGeometry(
    chunk,
    chunk.getWorldOriginPosition()
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
