import * as THREE from "three";
import InventoryManager, { Slot } from "../player/InventoryManager";
import SlotGrid from "./SlotGrid";

export default class Inventory {
  private inventoryManager: InventoryManager;

  public isOpen: boolean;

  // parent html element
  private overlayElement!: HTMLElement;
  private inventoryPanel!: HTMLElement;
  private dragItemElement!: HTMLElement;

  private craftingGrid!: HTMLElement;
  private inventoryGrid!: HTMLElement;
  private hotbarGrid!: HTMLElement;

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
    this.isOpen = false;

    this.initInventoryPanel();

    this.createCraftingGrid();
    this.createInventoryGrid();
    this.createHotbarGrid();
    this.createDragItemElement();

    this.initDragListener();
  }

  showInventory() {
    if (this.inventoryManager.isDirty) {
      this.syncInventory();
    }

    this.overlayElement.style.display = "block";
    this.inventoryPanel.style.display = "flex";
    this.isOpen = true;
  }

  hideInventory() {
    // perform a safe drop if it was dragging
    this.inventoryManager.safeEndDrag();

    // hide the inventory
    this.overlayElement.style.display = "none";
    this.dragItemElement.style.display = "none";
    this.inventoryPanel.style.display = "none";
    this.isOpen = false;
  }

  private syncInventory() {
    this.inventoryManager.isDirty = false;

    // sync crafting slots
    const craftingSlots = this.inventoryManager.getCraftingSlots();
    SlotGrid.drawGrid(
      this.craftingGrid,
      InventoryManager.CRAFTING_SLOTS,
      (idx) => this.inventoryManager.getItem(craftingSlots, idx)
    );

    // sync inventory slots
    const inventorySlots = this.inventoryManager.getInventorySlots();
    SlotGrid.drawGrid(
      this.inventoryGrid,
      InventoryManager.INVENTORY_SLOTS,
      (idx) => this.inventoryManager.getItem(inventorySlots, idx)
    );

    // sync hotbar slots
    const hotbarSlots = this.inventoryManager.getHotbarSlots();
    SlotGrid.drawGrid(this.hotbarGrid, InventoryManager.HOTBAR_SLOTS, (idx) =>
      this.inventoryManager.getItem(hotbarSlots, idx)
    );
  }

  private initInventoryPanel() {
    const inventoryElement = document.getElementById("inventory");
    const overlayElement = document.getElementById("overlay");

    if (!inventoryElement || !overlayElement) {
      throw new Error("Invalid inventory");
    }

    this.overlayElement = overlayElement;
    this.inventoryPanel = inventoryElement;
  }

  private initDragListener() {
    window.addEventListener("mousemove", (evt) => {
      if (this.inventoryManager.isDragging()) {
        this.dragItemElement.style.left = `${evt.pageX}px`;
        this.dragItemElement.style.top = `${evt.pageY}px`;
      }
    });
  }

  private createCraftingGrid() {
    const craftingGrid = document.getElementById("crafting-grid");

    if (!craftingGrid) {
      throw new Error("Inventory markup not found");
    }

    this.craftingGrid = craftingGrid;

    const craftingSlots = this.inventoryManager.getCraftingSlots();
    SlotGrid.createSlots(craftingGrid, InventoryManager.CRAFTING_SLOTS, (idx) =>
      this.inventoryManager.getItem(craftingSlots, idx)
    );
    this.addSlotGridClickListener(craftingGrid, craftingSlots);
  }

  private createInventoryGrid() {
    const inventoryGrid = document.getElementById("inventory-grid");

    if (!inventoryGrid) {
      throw new Error("Inventory slots markup not found");
    }

    this.inventoryGrid = inventoryGrid;

    const inventorySlots = this.inventoryManager.getInventorySlots();
    SlotGrid.createSlots(
      inventoryGrid,
      InventoryManager.INVENTORY_SLOTS,
      (idx) => this.inventoryManager.getItem(inventorySlots, idx)
    );
    this.addSlotGridClickListener(inventoryGrid, inventorySlots);
  }

  private createHotbarGrid() {
    const hotbarGrid = document.getElementById("inventory-hotbar-grid");

    if (!hotbarGrid) {
      throw new Error("Inventory markup not found");
    }

    this.hotbarGrid = hotbarGrid;

    const hotbarSlots = this.inventoryManager.getHotbarSlots();
    SlotGrid.createSlots(hotbarGrid, InventoryManager.HOTBAR_SLOTS, (idx) =>
      this.inventoryManager.getItem(hotbarSlots, idx)
    );

    this.addSlotGridClickListener(hotbarGrid, hotbarSlots);
  }

  private addSlotGridClickListener(slotGrid: HTMLElement, items: Slot[]) {
    slotGrid.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;

      let slotElem: HTMLElement | null = null;

      if (target.classList.contains("amount")) {
        slotElem = target.parentElement!.parentElement;
      }

      if (target.classList.contains("item")) {
        slotElem = target.parentElement;
      }

      if (target.classList.contains("slot")) {
        slotElem = target;
      }

      if (slotElem) {
        const cursor = new THREE.Vector2(e.pageX, e.pageY);
        const slotIndex = SlotGrid.getSlotIndex(slotElem);

        switch (e.button) {
          // left click
          case 0: {
            this.handleDragAndDrop(slotElem, items, slotIndex, cursor, true);
            break;
          }
          // right click
          case 2: {
            this.handleDragAndDrop(slotElem, items, slotIndex, cursor, false);
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
      this.inventoryManager.endDrag(items, index, isM1 ? false : true);
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
