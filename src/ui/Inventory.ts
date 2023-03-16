import * as THREE from "three";
import InventoryManager, { Slot } from "../player/InventoryManager";
import SlotGrid from "./SlotGrid";

const dataSlotIndexAttr = "data-slot-index";

export default class Inventory {
  private inventoryManager: InventoryManager;

  public isOpen: boolean;

  // parent html element
  private overlayElement!: HTMLElement;
  private inventoryElement!: HTMLElement;
  private dragItemElement!: HTMLDivElement;

  private craftingSlotsEl!: HTMLElement;
  private inventorySlotsEl!: HTMLElement;
  private hotbarSlotsEl!: HTMLElement;

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
    this.isOpen = false;

    this.initInventoryElement();
    this.createCraftingSlots();
    this.createInventorySlots();
    this.createHotbarSlots();
    this.createDragItemElement();
    this.initDragListener();
  }

  showInventory() {
    if (this.inventoryManager.isDirty) {
      this.syncInventory();
    }

    this.overlayElement.style.display = "block";
    this.inventoryElement.style.display = "flex";
    this.isOpen = true;
  }

  hideInventory() {
    // perform a safe drop if it was dragging
    this.inventoryManager.safeDrop();

    // hide the inventory
    this.overlayElement.style.display = "none";
    this.dragItemElement.style.display = "none";
    this.inventoryElement.style.display = "none";
    this.isOpen = false;
  }

  private syncInventory() {
    this.inventoryManager.isDirty = false;

    // sync crafting slots
    const craftingSlots = this.inventoryManager.getCraftingSlots();
    SlotGrid.drawSlots(
      this.craftingSlotsEl,
      InventoryManager.CRAFTING_SLOTS,
      (idx) => this.inventoryManager.getItem(craftingSlots, idx)
    );

    // sync inventory slots
    const inventorySlots = this.inventoryManager.getInventorySlots();
    SlotGrid.drawSlots(
      this.inventorySlotsEl,
      InventoryManager.INVENTORY_SLOTS,
      (idx) => this.inventoryManager.getItem(inventorySlots, idx)
    );

    // sync hotbar slots
    const hotbarSlots = this.inventoryManager.getHotbarSlots();
    SlotGrid.drawSlots(
      this.hotbarSlotsEl,
      InventoryManager.HOTBAR_SLOTS,
      (idx) => this.inventoryManager.getItem(hotbarSlots, idx)
    );
  }

  private initInventoryElement() {
    const inventoryElement = document.getElementById("inventory");
    const overlayElement = document.getElementById("overlay");

    if (!inventoryElement || !overlayElement) {
      throw new Error("Invalid inventory");
    }

    this.overlayElement = overlayElement;
    this.inventoryElement = inventoryElement;
  }

  private initDragListener() {
    window.addEventListener("mousemove", (evt) => {
      if (this.inventoryManager.isDragging()) {
        this.dragItemElement.style.left = `${evt.pageX}px`;
        this.dragItemElement.style.top = `${evt.pageY}px`;
      }
    });
  }

  private createCraftingSlots() {
    const craftingSlotsEl = document.getElementById("crafting-slots");

    if (!craftingSlotsEl) {
      throw new Error("Inventory markup not found");
    }

    this.craftingSlotsEl = craftingSlotsEl;

    const craftingSlots = this.inventoryManager.getCraftingSlots();
    SlotGrid.createSlots(
      craftingSlotsEl,
      InventoryManager.CRAFTING_SLOTS,
      (idx) => this.inventoryManager.getItem(craftingSlots, idx)
    );
    this.addSlotGridClickListener(craftingSlotsEl, craftingSlots);
  }

  private createInventorySlots() {
    const inventorySlotsEl = document.getElementById("inventory-slots");

    if (!inventorySlotsEl) {
      throw new Error("Inventory slots markup not found");
    }

    this.inventorySlotsEl = inventorySlotsEl;

    const inventorySlots = this.inventoryManager.getInventorySlots();
    SlotGrid.createSlots(
      inventorySlotsEl,
      InventoryManager.INVENTORY_SLOTS,
      (idx) => this.inventoryManager.getItem(inventorySlots, idx)
    );
    this.addSlotGridClickListener(inventorySlotsEl, inventorySlots);
  }

  private createHotbarSlots() {
    const hotbarSlotsEl = document.getElementById("inventory-hotbar-slots");

    if (!hotbarSlotsEl) {
      throw new Error("Inventory markup not found");
    }

    this.hotbarSlotsEl = hotbarSlotsEl;

    const hotbarSlots = this.inventoryManager.getHotbarSlots();
    SlotGrid.createSlots(hotbarSlotsEl, InventoryManager.HOTBAR_SLOTS, (idx) =>
      this.inventoryManager.getItem(hotbarSlots, idx)
    );

    this.addSlotGridClickListener(hotbarSlotsEl, hotbarSlots);
  }

  private addSlotGridClickListener(slotGrid: HTMLElement, items: Slot[]) {
    slotGrid.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;

      let slotElement: HTMLElement | null = null;

      if (target.classList.contains("amount")) {
        slotElement = target.parentElement!.parentElement;
      }

      if (target.classList.contains("item")) {
        slotElement = target.parentElement;
      }

      if (target.classList.contains("slot")) {
        slotElement = target;
      }

      if (slotElement) {
        const cursor = new THREE.Vector2(e.pageX, e.pageY);
        const slotIndex = slotElement.getAttribute(dataSlotIndexAttr)!;

        switch (e.button) {
          // left click
          case 0: {
            this.handleDragAndDrop(
              slotElement,
              items,
              parseInt(slotIndex),
              cursor,
              true
            );
            break;
          }
          // right click
          case 2: {
            this.handleDragAndDrop(
              slotElement,
              items,
              parseInt(slotIndex),
              cursor,
              false
            );
            break;
          }
        }
      }
    });
  }

  private handleDragAndDrop(
    slotElement: HTMLElement,
    items: Slot[],
    index: number,
    cursor: THREE.Vector2,
    isM1: boolean
  ) {
    const isDragging = this.inventoryManager.isDragging();

    if (isDragging) {
      this.inventoryManager.drop(items, index, isM1 ? false : true);
      this.drawDraggingItem(cursor);

      // re draw the slot
      const item = this.inventoryManager.getItem(items, index);
      SlotGrid.drawSlot(slotElement, item);
    } else {
      // if the selected slot is not empty, we begin dragging the item
      const hasItem = this.inventoryManager.getItem(items, index);

      if (hasItem) {
        // start dragging the item
        const slot = this.inventoryManager.beginDrag(
          items,
          index,
          isM1 ? false : true
        );

        // re draw the slot
        SlotGrid.drawSlot(slotElement, slot);
        // draw the dragged item
        this.drawDraggingItem(cursor);
      }
    }
  }

  private createDragItemElement() {
    this.dragItemElement = document.createElement("div");
    const amountText = document.createElement("span");

    this.dragItemElement.id = "inventory-drag";
    this.dragItemElement.style.display = "none";
    this.dragItemElement.classList.add("item");

    amountText.classList.add("amount");
    this.dragItemElement.appendChild(amountText);

    document.body.appendChild(this.dragItemElement);
  }

  private drawDraggingItem({ x, y }: THREE.Vector2) {
    const isDragging = this.inventoryManager.isDragging();

    if (isDragging) {
      const draggedItem = this.inventoryManager.getDraggingItem()!;

      // show up the dragged item element
      this.dragItemElement.style.display = "block";

      // set the dragged item element position
      this.dragItemElement.style.left = `${x}px`;
      this.dragItemElement.style.top = `${y}px`;

      // draw the amount text element
      SlotGrid.drawItem(this.dragItemElement, draggedItem);
    } else {
      // hide the dragged item element
      this.dragItemElement.style.display = "none";
    }
  }
}
