import KeyBindings from "../config/KeyBindings";
import GameState from "../core/GameState";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import GameDataManager from "../io/GameDataManager";
import InputController from "../io/InputController";
import CrossHair from "./CrossHair";
import DebugInfo from "./DebugInfo";
import Hotbar from "./Hotbar";
import Inventory from "./Inventory";
import PausedMenu from "./PausedMenu";

export default class UI {
  private gameState: GameState;
  private dataManager: GameDataManager;

  private inputController: InputController;
  private player: Player;
  private terrain: Terrain;

  // UI's
  private pausedMenu: PausedMenu;
  private debugInfo: DebugInfo;
  private inventoryPanel!: Inventory;
  private hotbar!: Hotbar;
  private crosshair: CrossHair;

  private isFirstTime: boolean;

  // callbacks refs
  private keyDownHandlerRef: (evt: KeyboardEvent) => void;
  private customLockControlsHandlerRef: (evt: PointerEvent) => void;

  constructor(player: Player, terrain: Terrain) {
    this.gameState = GameState.getInstance();
    this.player = player;
    this.terrain = terrain;

    this.inputController = InputController.getInstance();
    this.dataManager = GameDataManager.getInstance();

    this.isFirstTime = true;
    this.crosshair = this.initCrosshair();
    this.hotbar = this.initHotbar(player);
    this.inventoryPanel = this.initInventoryPanel(player);

    this.pausedMenu = new PausedMenu();
    this.debugInfo = new DebugInfo(player, terrain);

    // callbacks refs
    this.keyDownHandlerRef = this.keyDownHandler.bind(this);
    this.customLockControlsHandlerRef =
      this.customControlsEnablerHandler.bind(this);
  }

  private initCrosshair() {
    const crosshair = new CrossHair();
    crosshair.show();

    return crosshair;
  }

  private initInventoryPanel(player: Player) {
    const inventory = new Inventory(player.getInventory());
    return inventory;
  }

  private initHotbar(player: Player) {
    const hotbar = new Hotbar(player.getInventory());
    hotbar.show();

    return hotbar;
  }

  update(dt: number) {
    this.debugInfo.update(dt);
  }

  enableEventListeners() {
    // custom event listeners
    document.addEventListener("pointerdown", this.customLockControlsHandlerRef);
    document.addEventListener("keydown", this.keyDownHandlerRef);

    this.pausedMenu.onResume(() => {
      this.pausedMenu.hide();
      this.gameState.setState("running");

      // re-enable game controls
      this.player.enableControls();
    });

    this.player.onDisableControls(() => {
      // if the inventory is not open it means the player paused the game
      if (!this.inventoryPanel.isOpen) {
        this.gameState.setState("paused");
        this.pausedMenu.show();
      }
    });

    this.pausedMenu.onQuit(async () => {
      console.log("Quitting game...");
      try {
        //TODO unload all the terrain chunks

        await this.saveGame();
        this.dispose();
        this.gameState.setState("menu");
      } catch (err) {
        console.error(err);
      }
    });
  }

  dispose() {
    this.pausedMenu.dispose();
    this.inventoryPanel.dispose();
    this.crosshair.dispose();
    this.hotbar.dispose();
    this.debugInfo.dispose();

    // remove custom event listeners
    document.removeEventListener("keydown", this.keyDownHandlerRef);
    document.removeEventListener(
      "pointerdown",
      this.customLockControlsHandlerRef
    );
  }

  private keyDownHandler(evt: KeyboardEvent) {
    switch (evt.code) {
      case KeyBindings.TOGGLE_INVENTORY_KEY: {
        this.toggleInventory();
        break;
      }
    }
  }

  /**
   * This is for locking the controls when the player clicks on the screen
   * when the game is running and the controls were not enabled.
   */
  private customControlsEnablerHandler(evt: PointerEvent) {
    const state = this.gameState.getState();
    const inventoryOpen = this.inventoryPanel.isOpen;
    const controlsEnabled = this.player.controlsEnabled();

    if (state === "running" && !inventoryOpen && !controlsEnabled) {
      this.player.enableControls();
    }
  }

  private async saveGame() {
    console.log("Saving game...");

    const seed = this.terrain.getSeed();
    const inventory = this.player.getInventory();

    // save player info
    const playerPosition = this.player.getPosition().toArray();
    await this.dataManager.savePlayerData(playerPosition);

    // save inventory
    await this.dataManager.saveInventory(
      inventory.getHotbarSlots(),
      inventory.getInventorySlots()
    );

    // save world info's
    this.dataManager.saveWorldData(seed);

    console.log("Game saved!");
  }

  private toggleInventory() {
    if (this.gameState.getState() === "running") {
      this.inventoryPanel.isOpen ? this.closeInventory() : this.openInventory();
    }
  }

  private openInventory() {
    this.inventoryPanel.show();
    this.player.disableControls();
  }

  private closeInventory() {
    this.player.enableControls();
    this.inventoryPanel.hide();
  }
}
