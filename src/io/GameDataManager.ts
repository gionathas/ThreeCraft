import Dexie from "dexie";
import { Slot } from "../player/InventoryManager";
import { Chunk, ChunkID } from "../terrain/chunk";
import { BufferGeometryData } from "../utils/helpers";

interface ChunkGeometryTable {
  chunkId: ChunkID;
  solidGeometry?: BufferGeometryData;
  transparentGeometry?: BufferGeometryData;
}

interface InventoryTable {
  inventoryId: string;
  hotbar: Slot[];
  inventory: Slot[];
}

export default class GameDataManager extends Dexie {
  private static instance: GameDataManager | null;

  // Chunks
  private chunks!: Dexie.Table<Chunk, ChunkID>;
  private chunksGeometries!: Dexie.Table<ChunkGeometryTable, ChunkID>;

  // Inventory
  private inventory!: Dexie.Table<InventoryTable, string>;

  private constructor() {
    super("GameDataManager");
    this.init();
  }

  //TODO add initialization logic (to execute only on New Game)

  private init() {
    this.version(1).stores({
      chunks: "&chunkId",
      chunksGeometries: "&chunkId",
      inventory: "&inventoryId",
    });

    this.chunks.mapToClass(Chunk);
  }

  public static getInstance(): GameDataManager {
    if (!this.instance) {
      this.instance = new GameDataManager();
    }
    return this.instance;
  }

  getSavedInventory() {
    return this.inventory.get("default");
  }

  async saveInventory(hotbar: Slot[], inventory: Slot[]) {
    return this.inventory.put({
      inventoryId: "default",
      hotbar,
      inventory,
    });
  }

  getSavedChunk(chunkId: ChunkID) {
    return this.chunks.get({ chunkId });
  }

  getSavedChunkGeometry(chunkId: ChunkID) {
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
