import GameState from "../core/GameState";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import GameDataManager from "../io/GameDataManager";
import InputController from "../io/InputController";
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
  private hotbar!: Hotbar;
  private inventoryPanel!: Inventory;
  private crosshair: HTMLElement;

  private isFirstTime: boolean;

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
  }

  private initCrosshair() {
    const crosshair = document.getElementById("crosshair")!;
    crosshair.style.display = "block";

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

  detachEventListeners() {
    //TODO
  }

  attachEventListeners() {
    //FIXME this is a temporary solution
    document.addEventListener("pointerdown", () => {
      if (this.isFirstTime) {
        this.isFirstTime = false;
        this.player.lockControls();
      }
    });

    // to prevent the context menu from appearingt
    document.addEventListener("contextmenu", (evt) => {
      evt.preventDefault();
    });

    document.addEventListener("keydown", (evt) => {
      switch (evt.code) {
        case "KeyT": {
          this.toggleInventory();
        }
      }
    });

    this.pausedMenu.setOnResumeClick(() => {
      this.player.lockControls();
    });

    this.pausedMenu.setOnQuitClick(async () => {
      try {
        await this.saveGame();
      } catch (err) {
        console.error(err);
      }
    });

    this.player.setOnLockControls(() => {
      // whenever the player locks the controls, it means that the game is running
      this.gameState.setState("running");

      if (this.pausedMenu.isVisible) {
        this.pausedMenu.hide();
      }

      // enable input listeners
      this.inputController.enable();
    });

    this.player.setOnUnlockControls(() => {
      // disable input listeners
      this.inputController.disable();

      // whenever the player unlocks the controls, it means that the game is paused
      if (!this.inventoryPanel.isOpen) {
        this.pauseGame();
      }
    });
  }

  private async saveGame() {
    console.log("Saving game...");

    const seed = this.terrain.getSeed();
    const inventory = this.player.getInventory();

    //TODO unload all the terrain chunks

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

  private pauseGame() {
    this.gameState.setState("paused");
    this.pausedMenu.show();
  }

  private toggleInventory() {
    if (this.gameState.getState() === "running") {
      this.inventoryPanel.isOpen ? this.closeInventory() : this.openInventory();
    }
  }

  private openInventory() {
    this.inventoryPanel.showInventory();
    this.player.unlockControls();
  }

  private closeInventory() {
    this.player.lockControls();
    this.inventoryPanel.hideInventory();
  }
}
