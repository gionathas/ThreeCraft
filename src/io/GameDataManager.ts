import Dexie from "dexie";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
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

interface PlayerDataTable {
  playerId: string;
  position: [number, number, number];
}

interface WorldDataTable {
  worldId: string;
  seed: string;
}

export default class GameDataManager extends Dexie {
  private static instance: GameDataManager | null;

  // Chunks
  private chunks!: Dexie.Table<Chunk, ChunkID>;
  private chunksGeometries!: Dexie.Table<ChunkGeometryTable, ChunkID>;

  // Inventory
  private inventory!: Dexie.Table<InventoryTable, string>;

  // Player
  private player!: Dexie.Table<PlayerDataTable, string>;

  // World
  private world!: Dexie.Table<WorldDataTable, string>;

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
      player: "&playerId",
      world: "&worldId",
    });

    this.chunks.mapToClass(Chunk);
  }

  public static getInstance(): GameDataManager {
    if (!this.instance) {
      this.instance = new GameDataManager();
    }
    return this.instance;
  }

  async saveGame(player: Player, terrain: Terrain) {
    console.log("Saving game...");

    const seed = terrain.getSeed();
    const inventory = player.getInventory();

    // save player info
    const playerPosition = player.getPosition().toArray();
    await this.savePlayerData(playerPosition);

    // save inventory
    await this.saveInventory(
      inventory.getHotbarSlots(),
      inventory.getInventorySlots()
    );

    // save world info's
    this.saveWorldData(seed);

    console.log("Game saved!");
  }

  getSavedWorldData() {
    return this.world.get("default");
  }

  async saveWorldData(seed: string) {
    return this.world.put({
      worldId: "default",
      seed,
    });
  }

  getSavedPlayerData() {
    return this.player.get("default");
  }

  async savePlayerData(position: [number, number, number]) {
    return this.player.put({
      playerId: "default",
      position,
    });
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
    return Promise.all([
      this.chunks.clear(),
      this.chunksGeometries.clear(),
      this.inventory.clear(),
      this.player.clear(),
    ]);
  }
}
