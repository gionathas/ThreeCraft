import GameState from "../core/GameState";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import DebugInfo from "./DebugInfo";
import Hotbar from "./Hotbar";
import Inventory from "./Inventory";
import PausedMenu from "./PausedMenu";

export default class UI {
  private gameState: GameState;
  private inputController: InputController;
  private player: Player;

  // UI's
  private hotbar: Hotbar;
  private inventory: Inventory;
  private pausedMenu: PausedMenu;
  private debugInfo: DebugInfo;

  private isFirstTime: boolean;

  constructor(player: Player, terrain: Terrain) {
    this.gameState = GameState.getInstance();
    this.player = player;
    this.inputController = InputController.getInstance();

    this.isFirstTime = true;

    const playerInventory = player.getInventoryManager();
    this.pausedMenu = new PausedMenu();
    this.inventory = new Inventory(playerInventory);
    this.hotbar = new Hotbar(playerInventory);
    this.debugInfo = new DebugInfo(player, terrain);
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
      if (!this.inventory.isOpen) {
        this.pauseGame();
      }
    });
  }

  private pauseGame() {
    this.gameState.setState("paused");
    this.pausedMenu.show();
  }

  private toggleInventory() {
    if (this.gameState.getState() === "running") {
      this.inventory.isOpen ? this.closeInventory() : this.openInventory();
    }
  }

  private openInventory() {
    this.inventory.showInventory();
    this.player.unlockControls();
  }

  private closeInventory() {
    this.player.lockControls();
    this.inventory.hideInventory();
  }
}
