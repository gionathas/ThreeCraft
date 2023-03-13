import Player from "../entities/Player";
import { BlockType } from "../terrain/block";

type Item = {
  block: BlockType;
  amount: number;
};

type Slot = Item | null;

export default class InventoryManager {
  static readonly INVENTORY_SLOTS = 27;
  static readonly HOTBAR_SLOTS = 9;
  static readonly CRAFTING_SLOTS = 9;

  private player: Player;
  private inventory: Slot[];
  private hotbar: Slot[];
  private selectedItem: Item | null;

  constructor(player: Player) {
    this.player = player;
    this.inventory = new Array(InventoryManager.INVENTORY_SLOTS).fill(null);
    this.hotbar = new Array(InventoryManager.HOTBAR_SLOTS).fill(null);
    this.selectedItem = null;
  }

  openInventory() {
    this.player.disableControls();
  }

  closeInventory() {
    this.player.enableControls();
  }

  hasSelectedItem() {
    return this.selectedItem !== null;
  }

  getSelectedItem() {
    return this.selectedItem;
  }

  isHotbarSlotEmpty(index: number) {
    return this.hotbar[index] === null;
  }

  getHotbarItem(index: number) {
    return this.hotbar[index];
  }

  isInventorySlotEmpty(index: number) {
    return this.inventory[index] === null;
  }

  getInventoryItem(index: number) {
    return this.inventory[index];
  }
}
