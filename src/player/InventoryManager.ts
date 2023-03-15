import { BlockType } from "../terrain/block";

export type Item = {
  block: BlockType;
  amount: number;
};

export type Slot = Item | null;

export default class InventoryManager {
  static readonly MAX_STACK_SIZE = 64;

  static readonly INVENTORY_SLOTS = 27;
  static readonly HOTBAR_SLOTS = 9;
  static readonly CRAFTING_SLOTS = 9;

  private crafting: Slot[];
  private inventory: Slot[];
  private hotbar: Slot[];

  private draggingItem: Item | null;
  public isDirty: boolean;

  constructor() {
    this.inventory = new Array(InventoryManager.INVENTORY_SLOTS)
      .fill(null)
      .map((_, idx) => {
        if (idx < 2) {
          return { block: BlockType.DIRT, amount: 10 };
        }

        if (idx < 4) {
          return { block: BlockType.DIRT, amount: 1 };
        }

        if (idx < 6) {
          return { block: BlockType.DIRT, amount: 44 };
        }

        return null;
      });
    this.hotbar = new Array(InventoryManager.HOTBAR_SLOTS).fill(null);
    this.crafting = new Array(InventoryManager.CRAFTING_SLOTS).fill(null);
    this.draggingItem = null;
    this.isDirty = false;
  }

  //TODO
  load() {}

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

  endDrag() {
    if (this.isDragging()) {
      // mark the inventory as dirty
      this.isDirty = true;

      // find an empty slot to place the dragged item
      const emptySlotIdx = this.inventory.findIndex((slot) =>
        this.isSlotEmpty(slot)
      );
      this.placeDragItem(this.inventory, emptySlotIdx);
      this.setDraggingItem(null);
    }
  }

  placeDragItem(items: Slot[], index: number): boolean {
    const item = this.getDraggingItem();

    if (item) {
      const endSlot = this.getItem(items, index);

      // empty slot, place the item and stop dragging it
      if (endSlot == null) {
        this.setItem(items, index, item);
        this.setDraggingItem(null);
        return false;
      }

      // slot is not empty, check if the item is the same
      if (endSlot.block === item.block) {
        const newAmount = endSlot.amount + item.amount;

        // if the item is the same and the stack is not full, add the item to the stack
        if (newAmount <= InventoryManager.MAX_STACK_SIZE) {
          endSlot.amount = newAmount;
          this.setDraggingItem(null);
          return false;
        }

        // if the item is the same and the stack is full, place the item in the slot and keep dragging the rest
        if (newAmount > InventoryManager.MAX_STACK_SIZE) {
          const remainingAmount = newAmount - InventoryManager.MAX_STACK_SIZE;
          endSlot.amount = InventoryManager.MAX_STACK_SIZE;
          this.setDraggingItem({ block: item.block, amount: remainingAmount });
          return true;
        }
      }
    }

    return false;
  }

  getItem(items: Slot[], index: number): Item | null {
    return items[index];
  }

  private setItem(items: Slot[], index: number, item: Item) {
    items[index] = item;
  }

  private removeItem(items: Slot[], index: number) {
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
