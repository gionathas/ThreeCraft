import EventEmitter from "events";
import * as THREE from "three";
import GameDataManager from "../io/GameDataManager";
import { BlockType } from "../terrain/block";

export type Item = {
  block: BlockType;
  amount: number;
};

export type InventoryState = {
  hotbar: Slot[];
  inventory: Slot[];
};

export type Slot = Item | null;

export default class InventoryManager {
  static readonly MAX_STACK_SIZE = 64;

  static readonly INVENTORY_SLOTS = 27;
  static readonly HOTBAR_SLOTS = 9;
  static readonly CRAFTING_SLOTS = 9;

  private dataManager: GameDataManager;
  public isDirty: boolean;

  private crafting: Slot[];
  private inventory: Slot[];
  private hotbar: Slot[];

  private draggedItem: Item | null;
  private selectedHotbarIndex: number;

  private eventEmitter: EventEmitter;

  constructor(inventory: InventoryState) {
    this.dataManager = GameDataManager.getInstance();
    this.eventEmitter = new EventEmitter();

    this.selectedHotbarIndex = 0;
    this.draggedItem = null;
    this.isDirty = false;

    this.inventory = new Array(InventoryManager.INVENTORY_SLOTS).fill(null);
    this.hotbar = new Array(InventoryManager.HOTBAR_SLOTS).fill(null);
    this.crafting = new Array(InventoryManager.CRAFTING_SLOTS).fill(null);

    this.loadInventory(inventory);
  }

  private loadInventory({ inventory, hotbar }: InventoryState) {
    this.inventory.map((_, i) => (this.inventory[i] = inventory[i] ?? null));
    this.hotbar.map((_, i) => (this.hotbar[i] = hotbar[i] ?? null));
  }

  async saveInventory() {
    this.dataManager.saveInventory(this.hotbar, this.inventory);
  }

  beginDrag(items: Slot[], index: number, split: boolean): Item | null {
    const item = this.getItem(items, index);

    if (!item) {
      return null;
    }

    const unitsToPick = split ? Math.floor(item.amount / 2) : item.amount;
    const isSingleUnit = item.amount === 1;
    const pickAllUnits = unitsToPick === item.amount;

    if (isSingleUnit || pickAllUnits) {
      // pick the whole item
      this.setDraggingItem(item);
      // and clear the slot
      return this.clearSlot(items, index);
    } else {
      const unitsRemaining = item.amount - unitsToPick;

      // pick half of the item
      this.setDraggingItem({ ...item, amount: unitsToPick });
      // and leave the other half in the slot
      return this.setSlot(items, index, { ...item, amount: unitsRemaining });
    }
  }

  endDrag(items: Slot[], index: number, singleUnit = false): Item | null {
    const dragItem = this.getDraggedItem();

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
      this.setSlot(items, index, {
        ...dragItem,
        amount: unitsToPlace,
      });

      return this.setDraggingItem(nextDraggedItem);
    }

    // slot is not empty and items are the same, try to stack them
    if (targetSlot.block === dragItem.block) {
      // item is already maxed out, perform a swap
      if (targetSlot.amount === InventoryManager.MAX_STACK_SIZE) {
        this.setSlot(items, index, dragItem);
        return this.setDraggingItem(targetSlot);
      }

      const newAmount = targetSlot.amount + unitsToPlace;

      // item stack is not full, add the item to the stack
      if (newAmount <= InventoryManager.MAX_STACK_SIZE) {
        targetSlot.amount = newAmount;

        this.setSlot(items, index, targetSlot);
        return this.setDraggingItem(nextDraggedItem);
      }

      // item stack will overcome its limit, so place the item in the slot
      // and keep dragging the remaining amount
      if (newAmount > InventoryManager.MAX_STACK_SIZE) {
        const remainingAmount = newAmount - InventoryManager.MAX_STACK_SIZE;

        // fill the current slot and update it
        targetSlot.amount = InventoryManager.MAX_STACK_SIZE;
        this.setSlot(items, index, targetSlot);

        // set the dragging item to the remaining amount
        return this.setDraggingItem({
          block: dragItem.block,
          amount: remainingAmount,
        });
      }
    }

    // slot is not empty and items are different, perform a swap
    this.setSlot(items, index, dragItem);
    return this.setDraggingItem(targetSlot);
  }

  /**
   * This will force the end of the drag, by placing the dragged item in the first empty slot
   */
  forceEndDrag() {
    if (this.isDragging()) {
      // mark the inventory as dirty
      this.isDirty = true;

      // find an empty slot to place the dragged item
      const emptySlotIdx = this.inventory.findIndex((slot) =>
        this.isSlotEmpty(slot)
      );
      this.endDrag(this.inventory, emptySlotIdx);
      this.setDraggingItem(null);
    }
  }

  /**
   * Add an item to the inventory, if the inventory is not full
   */
  addItem(item: Item): boolean {
    this.isDirty = true;

    let remainingAmount = item.amount;

    // first try to add the item to the hotbar
    remainingAmount = this.addItemTo(this.hotbar, item);

    // if there are still items left, try to add them to the inventory
    if (remainingAmount > 0) {
      remainingAmount = this.addItemTo(this.inventory, {
        block: item.block,
        amount: remainingAmount,
      });
    }

    return remainingAmount === 0;
  }

  private addItemTo(items: Slot[], item: Item): number {
    let remainingAmount = item.amount;

    let emptyPosition: number | null = null;

    for (let i = 0; i < items.length; i++) {
      const slotItem = this.getItem(items, i);

      // found an empty slot
      if (slotItem == null) {
        // if this is the first empty slot we find, let's remember its position
        if (emptyPosition == null) {
          emptyPosition = i;
        }

        // skip to the next slot
        continue;
      }

      // found a non-empty slot, let's try to add the items here
      remainingAmount = this.addItemToSlot(items, i, {
        block: item.block,
        amount: remainingAmount,
      });

      // no more items left, we can stop here
      if (remainingAmount === 0) {
        return 0;
      }
    }

    // if there are still items left, let's add them to the empty slot
    if (remainingAmount > 0 && emptyPosition != null) {
      remainingAmount = this.addItemToSlot(items, emptyPosition, {
        block: item.block,
        amount: remainingAmount,
      });
    }

    return remainingAmount;
  }

  /**
   * Add the item to the slot, if possible
   *
   * This means that:
   * if the slot is empty, the item will be placed inside the slot
   * If the slot is not empty, the item will be stacked with the existing item
   * If the slot is not empty and the items are different, nothing will happen
   *
   * @returns the remaining amount of items that couldn't be added
   */
  private addItemToSlot(items: Slot[], index: number, item: Item): number {
    const slotItem = this.getItem(items, index);

    // empty slot, just place the item
    if (slotItem == null) {
      this.setSlot(items, index, item);
      return 0;
    }

    // slot is not empty and items are the same, try to stack them
    if (slotItem.block === item.block) {
      // item is already maxed out, we can't add the item
      if (slotItem.amount === InventoryManager.MAX_STACK_SIZE) {
        return item.amount;
      }

      const newAmount = slotItem.amount + item.amount;

      // the slot can be filled up without overflowing
      if (newAmount <= InventoryManager.MAX_STACK_SIZE) {
        // update the amount and update it
        slotItem.amount = newAmount;
        this.setSlot(items, index, slotItem);

        return 0;
      }

      // item stack is full, place the item in the slot and keep dragging the rest
      if (newAmount > InventoryManager.MAX_STACK_SIZE) {
        const remainingAmount = newAmount - InventoryManager.MAX_STACK_SIZE;

        // fill the current slot and update it
        slotItem.amount = InventoryManager.MAX_STACK_SIZE;
        this.setSlot(items, index, slotItem);

        // return the amount of items that couldn't be added
        return remainingAmount;
      }
    }

    // slot is not empty and items are different, we can't add the item
    return item.amount;
  }

  getItem(items: Slot[], index: number): Item | null {
    return items[index];
  }

  private setSlot(items: Slot[], index: number, item: Item) {
    items[index] = item;

    this.eventEmitter.emit("change", items, index, item);
    return item;
  }

  private clearSlot(items: Slot[], index: number) {
    items[index] = null;

    this.eventEmitter.emit("change", items, index, null);
    return null;
  }

  decrementSelectedItemAmount() {
    this.isDirty = true;

    const selectedItem = this.getSelectedItem();

    if (selectedItem) {
      const newAmount = selectedItem.amount - 1;

      // still items left, update the slot
      if (newAmount > 0) {
        this.setSlot(this.hotbar, this.selectedHotbarIndex, {
          ...selectedItem,
          amount: newAmount,
        });
      }

      // no more items left, clear the slot
      if (newAmount === 0) {
        this.clearSlot(this.hotbar, this.selectedHotbarIndex);
      }
    }
  }

  getSelectedItem(): Item | null {
    return this.hotbar[this.selectedHotbarIndex];
  }

  setSelectedIndex(index: number) {
    this.selectedHotbarIndex = THREE.MathUtils.euclideanModulo(
      index,
      InventoryManager.HOTBAR_SLOTS
    );
  }

  getSelectedIndex(): number {
    return this.selectedHotbarIndex;
  }

  onHotbarChange(callback: (items: Slot[], index: number, item: Item) => void) {
    this.eventEmitter.on("change", (items, index, item) => {
      if (items === this.hotbar) {
        callback(items, index, item);
      }
    });
  }

  isDragging() {
    return this.draggedItem !== null;
  }

  getDraggedItem() {
    return this.draggedItem;
  }

  isSlotEmpty(slot: Slot) {
    return slot === null;
  }

  private setDraggingItem(item: Item | null) {
    this.draggedItem = item;
    return item;
  }

  getInventorySlots(): Slot[] {
    return this.inventory;
  }

  getHotbarSlots(): Slot[] {
    return this.hotbar;
  }

  getCraftingSlots(): Slot[] {
    return this.crafting;
  }
}
