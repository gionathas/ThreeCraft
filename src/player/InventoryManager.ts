import { BlockType } from "../terrain/block";

export type Item = {
  block: BlockType;
  amount: number;
};

export type Slot = Item | null;

export default class InventoryManager {
  static readonly INVENTORY_SLOTS = 27;
  static readonly HOTBAR_SLOTS = 9;
  static readonly CRAFTING_SLOTS = 9;

  private crafting: Slot[];
  private inventory: Slot[];
  private hotbar: Slot[];

  private draggingItem: Item | null;

  constructor() {
    this.inventory = new Array(InventoryManager.INVENTORY_SLOTS)
      .fill(null)
      .map((_, idx) => {
        if (idx < 5) {
          return { block: BlockType.DIRT, amount: 10 };
        }

        return null;
      });
    this.hotbar = new Array(InventoryManager.HOTBAR_SLOTS).fill(null);
    this.crafting = new Array(InventoryManager.CRAFTING_SLOTS).fill(null);
    this.draggingItem = null;
  }

  isDragging() {
    return this.draggingItem !== null;
  }

  getDraggingItem() {
    return this.draggingItem;
  }

  isSlotEmpty(slot: Slot) {
    return slot === null;
  }

  beginDrag(items: Slot[], index: number) {
    const item = this.getItem(items, index);

    if (item) {
      this.setDraggingItem(item);
      this.removeItem(items, index);
    }

    return item;
  }

  endDrag(items: Slot[], index: number) {
    const item = this.getDraggingItem();

    if (item) {
      this.setItem(items, index, item);
      this.setDraggingItem(null);
    }
  }

  getItem(items: Slot[], index: number): Item | null {
    return items[index];
  }

  setItem(items: Slot[], index: number, item: Item) {
    items[index] = item;
  }

  removeItem(items: Slot[], index: number) {
    items[index] = null;
  }

  private setDraggingItem(item: Item | null) {
    this.draggingItem = item;
  }

  getInventoryItems(): Slot[] {
    return this.inventory;
  }

  getHotbarItems(): Slot[] {
    return this.hotbar;
  }

  getCraftingSlots(): Slot[] {
    return this.crafting;
  }
}
