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
      this.placeDraggedItem(this.inventory, emptySlotIdx);
      this.setDraggingItem(null);
    }
  }

  placeDraggedItem(
    items: Slot[],
    index: number,
    singleUnit = false
  ): Item | null {
    const dragItem = this.getDraggingItem();

    // no item is being dragged
    if (!dragItem) {
      return null;
    }

    const targetSlot = this.getItem(items, index);
    const unitsToPlace = singleUnit ? 1 : dragItem.amount;
    const unitsRemaining = dragItem.amount - unitsToPlace;

    const nextDraggedItem =
      unitsRemaining > 0 ? { ...dragItem, amount: unitsRemaining } : null;

    // empty slot, place the item and stop dragging it
    if (targetSlot == null) {
      this.setItem(items, index, {
        ...dragItem,
        amount: unitsToPlace,
      });

      return this.setDraggingItem(nextDraggedItem);
    }

    // slot is not empty and items are the same, try to stack them
    if (targetSlot.block === dragItem.block) {
      // item is already maxed out, perform a swap
      if (targetSlot.amount === InventoryManager.MAX_STACK_SIZE) {
        this.setItem(items, index, dragItem);
        return this.setDraggingItem(targetSlot);
      }

      const newAmount = targetSlot.amount + unitsToPlace;

      // item stack is not full, add the item to the stack
      if (newAmount <= InventoryManager.MAX_STACK_SIZE) {
        targetSlot.amount = newAmount;
        return this.setDraggingItem(nextDraggedItem);
      }

      // item stack will overcome its limit, so place the item in the slot
      // and keep dragging the remaining amount
      if (newAmount > InventoryManager.MAX_STACK_SIZE) {
        const remainingAmount = newAmount - InventoryManager.MAX_STACK_SIZE;

        // fill the current slot
        targetSlot.amount = InventoryManager.MAX_STACK_SIZE;

        // set the dragging item to the remaining amount
        return this.setDraggingItem({
          block: dragItem.block,
          amount: remainingAmount,
        });
      }
    }

    // slot is not empty and items are different, perform a swap
    this.setItem(items, index, dragItem);
    return this.setDraggingItem(targetSlot);
  }

  /**
   * Add the item to the inventory, if the inventory is not full
   */
  addItem(item: Item): boolean {
    let remainingAmount = item.amount;

    // first try to add the item to the hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      remainingAmount = this.addItemToSlot(this.hotbar, i, {
        block: item.block,
        amount: remainingAmount,
      });

      if (remainingAmount === 0) {
        return true;
      }
    }

    // then try to add the item to the inventory
    for (let i = 0; i < this.inventory.length; i++) {
      remainingAmount = this.addItemToSlot(this.inventory, i, {
        block: item.block,
        amount: remainingAmount,
      });

      if (remainingAmount === 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add the item to the slot, if the slot is full, return the remaining amount
   */
  private addItemToSlot(items: Slot[], index: number, item: Item): number {
    const targetSlot = this.getItem(items, index);

    // empty slot, place the item
    if (targetSlot == null) {
      this.setItem(items, index, item);
      return 0;
    }

    // slot is not empty and items are the same, try to stack them
    if (targetSlot.block === item.block) {
      // item is already filled up, we can't add the item
      if (targetSlot.amount === InventoryManager.MAX_STACK_SIZE) {
        return item.amount;
      }

      const newAmount = targetSlot.amount + item.amount;

      // the slot can be filled up without overflowing
      if (newAmount <= InventoryManager.MAX_STACK_SIZE) {
        targetSlot.amount = newAmount;
        return 0;
      }

      // item stack is full, place the item in the slot and keep dragging the rest
      if (newAmount > InventoryManager.MAX_STACK_SIZE) {
        const remainingAmount = newAmount - InventoryManager.MAX_STACK_SIZE;

        // fill the current slot
        targetSlot.amount = InventoryManager.MAX_STACK_SIZE;

        // set the dragging item to the remaining amount
        return remainingAmount;
      }
    }

    // slot is not empty and items are different, we can't add the item
    return item.amount;
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
    return item;
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
