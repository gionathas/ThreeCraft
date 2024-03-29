import Dexie from "dexie";
import { Quaternion, Vector3, Vector3Tuple, Vector4Tuple } from "three";
import EnvVars from "../config/EnvVars";
import { Settings } from "../core/SettingsManager";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import { InventoryState, Slot } from "../player/InventoryManager";
import PlayerConstants from "../player/PlayerConstants";
import World from "../terrain/World";
import { Chunk, ChunkID } from "../terrain/chunk";
import Logger from "../tools/Logger";
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
  position: Vector3Tuple;
  quaternion: Vector4Tuple;
}

interface WorldDataTable {
  worldId: string;
  seed: string;
}

interface SettingsDataTable {
  settingsId: string;
  fov: number;
  renderDistance: number;
}

export type GameData = {
  world: {
    seed: string;
  };
  player: {
    spawnPosition?: THREE.Vector3;
    quaternion: THREE.Quaternion;
    inventory: InventoryState;
  };
};

export default class DataManager extends Dexie {
  // Chunks
  private chunks!: Dexie.Table<Chunk, ChunkID>;
  private chunksGeometries!: Dexie.Table<ChunkGeometryTable, ChunkID>;

  // Inventory
  private inventory!: Dexie.Table<InventoryTable, string>;

  // Player
  private player!: Dexie.Table<PlayerDataTable, string>;

  // World
  private world!: Dexie.Table<WorldDataTable, string>;

  // Settings
  private settings!: Dexie.Table<SettingsDataTable, string>;

  constructor() {
    super("DataManager");
    this.init();
  }

  private init() {
    this.version(1).stores({
      chunks: "&chunkId",
      chunksGeometries: "&chunkId",
      inventory: "&inventoryId",
      player: "&playerId",
      world: "&worldId",
      settings: "&settingsId",
    });

    this.chunks.mapToClass(Chunk);
  }

  async saveGame(player: Player, terrain: Terrain) {
    Logger.info("Saving game...", Logger.DATA_KEY);

    const seed = terrain.getSeed();
    const inventory = player.getInventory();

    // save player info
    const playerPosition = player.getPosition().toArray();
    const playerQuaternion = player.getQuaternion().toArray() as Vector4Tuple;
    await this.savePlayerData(playerPosition, playerQuaternion);

    // save inventory
    await this.saveInventory(
      inventory.getHotbarSlots(),
      inventory.getInventorySlots()
    );

    // save world info's
    this.saveWorldData(seed);

    Logger.info("Game saved!", Logger.DATA_KEY);
  }

  async loadGameData(): Promise<GameData> {
    Logger.info("Loading game data...", Logger.LOADING_KEY);
    const worldData = await this.getWorldData();
    const playerData = await this.getPlayerData();
    const inventoryData = await this.getInventory();

    const seed = worldData?.seed
      ? worldData.seed
      : EnvVars.CUSTOM_SEED || World.generateSeed();

    const spawnPosition =
      playerData?.position && new Vector3().fromArray(playerData.position);

    const quaternion = playerData?.quaternion
      ? new Quaternion().fromArray(playerData.quaternion)
      : PlayerConstants.DEFAULT_LOOK_ROTATION;

    const inventory: GameData["player"]["inventory"] = inventoryData
      ? { hotbar: inventoryData.hotbar, inventory: inventoryData.inventory }
      : PlayerConstants.DEFAULT_INVENTORY_STATE;

    const gameData: GameData = {
      world: {
        seed,
      },
      player: {
        spawnPosition,
        quaternion,
        inventory,
      },
    };

    return gameData;
  }

  getWorldData() {
    return this.world.get("default");
  }

  async saveWorldData(seed: string) {
    return this.world.put({
      worldId: "default",
      seed,
    });
  }

  getPlayerData() {
    return this.player.get("default");
  }

  async savePlayerData(position: Vector3Tuple, quaternion: Vector4Tuple) {
    return this.player.put({
      playerId: "default",
      position,
      quaternion,
    });
  }

  getInventory() {
    return this.inventory.get("default");
  }

  async saveInventory(hotbar: Slot[], inventory: Slot[]) {
    return this.inventory.put({
      inventoryId: "default",
      hotbar,
      inventory,
    });
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

  async saveSettingsData(settings: Settings) {
    return this.settings.put({
      settingsId: "default",
      fov: settings.fov,
      renderDistance: settings.renderDistance,
    });
  }

  getSettingsData() {
    return this.settings.get("default");
  }

  clearGameData() {
    return Promise.all([
      this.chunks.clear(),
      this.chunksGeometries.clear(),
      this.inventory.clear(),
      this.player.clear(),
      this.world.clear(),
    ]);
  }
}
