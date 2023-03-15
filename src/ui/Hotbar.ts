import InventoryManager, { Slot } from "../player/InventoryManager";
import SlotGrid from "./SlotGrid";

export default class Hotbar {
  static readonly HOTBAR_SLOTS = 9;

  private inventoryManager: InventoryManager;

  private hotbarSlots: Slot[];

  private hotbarElement!: HTMLElement;

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
    this.hotbarSlots = this.inventoryManager.getHotbarItems();

    this.initHotbarElement();
    this.createHotbarSlots();
    this.initSelectionListener();
  }

  private initHotbarElement() {
    const hotbarElement = document.getElementById("hotbar");

    if (!hotbarElement) {
      throw new Error("Hotbar markup not found");
    }

    this.hotbarElement = hotbarElement;
  }

  private createHotbarSlots() {
    // creating the slots
    SlotGrid.createSlotGrid(this.hotbarElement, Hotbar.HOTBAR_SLOTS, (index) =>
      this.inventoryManager.getItem(this.hotbarSlots, index)
    );
  }

  private initSelectionListener() {
    window.addEventListener("wheel", (event) => {
      //TODO
    });
  }
}
