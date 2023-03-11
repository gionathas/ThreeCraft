import Dexie from "dexie";
import { Chunk, ChunkID } from "../terrain/chunk";
import { BufferGeometryData } from "../utils/helpers";

interface ChunkGeometryTable {
  chunkId: ChunkID;
  solidGeometry?: BufferGeometryData;
  transparentGeometry?: BufferGeometryData;
}

export default class GameDataManager extends Dexie {
  private static instance: GameDataManager | null;

  private chunks!: Dexie.Table<Chunk, ChunkID>;
  private chunksGeometries!: Dexie.Table<ChunkGeometryTable, ChunkID>;

  private constructor() {
    super("GameDataManager");
    this.init();
  }

  //TODO add initialization logic (to execute only on New Game)

  private init() {
    this.version(1).stores({
      chunks: "&chunkId",
      chunksGeometries: "&chunkId",
    });

    this.chunks.mapToClass(Chunk);
  }

  public static getInstance(): GameDataManager {
    if (!this.instance) {
      this.instance = new GameDataManager();
    }
    return this.instance;
  }

  getChunk(chunkId: ChunkID) {
    return this.chunks.get({ chunkId });
  }

  getChunkGeometry(chunkId: ChunkID) {
    return this.chunksGeometries.get({ chunkId });
  }

  async saveChunkData(
    chunk: Chunk,
    solidGeometry?: BufferGeometryData,
    transparentGeometry?: BufferGeometryData
  ) {
    await this.chunks.put(chunk, chunk.getId());
    await this.chunksGeometries.put(
      {
        chunkId: chunk.getId(),
        solidGeometry,
        transparentGeometry,
      },
      chunk.getId()
    );
  }

  clearAllData() {
    return Promise.all([this.chunks.clear(), this.chunksGeometries.clear()]);
  }
}
