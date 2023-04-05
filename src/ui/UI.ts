import KeyBindings from "../config/KeyBindings";
import GameState from "../core/GameState";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import GameDataManager from "../io/GameDataManager";
import CrossHair from "./CrossHair";
import DebugInfo from "./DebugInfo";
import Hotbar from "./Hotbar";
import Inventory from "./Inventory";
import PausedMenu from "./PausedMenu";

export default class UI {
  private gameState: GameState;
  private dataManager: GameDataManager;

  private player: Player;
  private terrain: Terrain;

  // UI's
  private pausedMenu: PausedMenu;
  private debugInfo: DebugInfo;
  private inventoryPanel!: Inventory;
  private hotbar!: Hotbar;
  private crosshair: CrossHair;

  // callbacks refs
  private interactionHandlerRef: (evt: KeyboardEvent) => void;
  private customLockControlsHandlerRef: (evt: PointerEvent) => void;

  constructor(player: Player, terrain: Terrain) {
    this.gameState = GameState.getInstance();
    this.player = player;
    this.terrain = terrain;

    this.dataManager = GameDataManager.getInstance();

    this.crosshair = this.initCrosshair();
    this.hotbar = this.initHotbar(player);
    this.inventoryPanel = this.initInventoryPanel(player);

    this.pausedMenu = new PausedMenu();
    this.debugInfo = new DebugInfo(player, terrain);

    // callbacks refs
    this.interactionHandlerRef = this.interactionHandler.bind(this);
    this.customLockControlsHandlerRef =
      this.customControlsEnablerHandler.bind(this);
    this.initEventListeners();
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

  private initEventListeners() {
    // custom event listeners
    document.addEventListener("pointerdown", this.customLockControlsHandlerRef);
    document.addEventListener("keydown", this.interactionHandlerRef);

    this.pausedMenu.onResume(() => {
      this.pausedMenu.hide();
      this.gameState.setState("running");

      // re-enable game controls
      this.player.lockControls();
    });

    this.player.onDisableControls(() => {
      // if the inventory is not open it means the player paused the game
      if (!this.inventoryPanel.isOpen) {
        this.gameState.setState("paused");
        this.pausedMenu.show();
      }
    });

    this.pausedMenu.onQuit(async () => {
      // save game
      await this.dataManager.saveGame(this.player, this.terrain);

      // set main menu state
      this.gameState.setState("menu");
    });
  }

  private interactionHandler(evt: KeyboardEvent) {
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
    const controlsEnabled = this.player.controlsLocked();

    if (state === "running" && !inventoryOpen && !controlsEnabled) {
      this.player.lockControls();
    }
  }

  update() {
    this.debugInfo.update();
  }

  dispose() {
    this.pausedMenu.dispose();
    this.inventoryPanel.dispose();
    this.crosshair.dispose();
    this.hotbar.dispose();
    this.debugInfo.dispose();

    // remove custom event listeners
    document.removeEventListener("keydown", this.interactionHandlerRef);
    document.removeEventListener(
      "pointerdown",
      this.customLockControlsHandlerRef
    );
  }

  private toggleInventory() {
    if (this.gameState.getState() === "running") {
      this.inventoryPanel.isOpen ? this.closeInventory() : this.openInventory();
    }
  }

  private openInventory() {
    this.inventoryPanel.show();
    this.player.unlockControls();
  }

  private closeInventory() {
    this.player.lockControls();
    this.inventoryPanel.hide();
  }
}
