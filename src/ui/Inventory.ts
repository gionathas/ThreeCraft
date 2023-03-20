import * as THREE from "three";
import InventoryManager, { Slot } from "../player/InventoryManager";
import SlotGrid from "./SlotGrid";
import { UIComponent } from "./UIComponent";

export default class Inventory implements UIComponent {
  private inventoryManager: InventoryManager;

  public isOpen: boolean;

  // parent html element
  private overlayElement: HTMLElement;
  private inventoryPanel: HTMLElement;
  private dragItemElement: HTMLElement;

  private craftingGrid: HTMLElement;
  private inventoryGrid!: HTMLElement;
  private hotbarGrid: HTMLElement;

  // callback refs
  private hotbarSelectionHandlerRef!: (e: PointerEvent) => void;
  private inventorySelectionHandlerRef!: (e: PointerEvent) => void;
  private dragMoveHandlerRef!: (evt: MouseEvent) => void;
  private craftingSelectionHandlerRef!: (e: PointerEvent) => void;

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
    this.isOpen = false;

    this.inventoryPanel = document.getElementById("inventory")!;
    this.overlayElement = document.getElementById("overlay")!;

    this.craftingGrid = this.createCraftingGrid();
    this.inventoryGrid = this.createInventoryGrid();
    this.hotbarGrid = this.createHotbarGrid();
    this.dragItemElement = this.createDragItemElement();
  }

  show() {
    if (this.inventoryManager.isDirty) {
      this.syncInventory();
    }

    this.overlayElement.style.display = "block";
    this.inventoryPanel.style.display = "flex";
    this.isOpen = true;
  }

  hide() {
    // perform a safe drop if it was dragging
    this.inventoryManager.forceEndDrag();

    // hide the inventory
    this.overlayElement.style.display = "none";
    this.dragItemElement.style.display = "none";
    this.inventoryPanel.style.display = "none";
    this.isOpen = false;
  }

  dispose(): void {
    this.hide();

    // remove dom elements
    SlotGrid.removeSlots(this.craftingGrid);
    SlotGrid.removeSlots(this.inventoryGrid);
    SlotGrid.removeSlots(this.hotbarGrid);
    this.dragItemElement.remove();

    // remove event listeners
    document.removeEventListener("mousemove", this.dragMoveHandlerRef);
    this.craftingGrid.removeEventListener(
      "pointerdown",
      this.craftingSelectionHandlerRef
    );
    this.inventoryGrid.removeEventListener(
      "pointerdown",
      this.inventorySelectionHandlerRef
    );
    this.hotbarGrid.removeEventListener(
      "pointerdown",
      this.hotbarSelectionHandlerRef
    );
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

  private createCraftingGrid() {
    const craftingGrid = document.getElementById("crafting-grid")!;

    const craftingSlots = this.inventoryManager.getCraftingSlots();
    SlotGrid.createSlots(craftingGrid, InventoryManager.CRAFTING_SLOTS, (idx) =>
      this.inventoryManager.getItem(craftingSlots, idx)
    );

    // add selection listener
    this.craftingSelectionHandlerRef =
      this.slotSelectionHandler(craftingSlots).bind(this);

    craftingGrid.addEventListener(
      "pointerdown",
      this.craftingSelectionHandlerRef
    );

    return craftingGrid;
  }

  private createInventoryGrid() {
    const inventoryGrid = document.getElementById("inventory-grid")!;

    const inventorySlots = this.inventoryManager.getInventorySlots();
    SlotGrid.createSlots(
      inventoryGrid,
      InventoryManager.INVENTORY_SLOTS,
      (idx) => this.inventoryManager.getItem(inventorySlots, idx)
    );

    // add selection listener
    this.inventorySelectionHandlerRef =
      this.slotSelectionHandler(inventorySlots).bind(this);
    inventoryGrid.addEventListener(
      "pointerdown",
      this.inventorySelectionHandlerRef
    );

    return inventoryGrid;
  }

  private createHotbarGrid() {
    const hotbarGrid = document.getElementById("inventory-hotbar-grid")!;

    const hotbarSlots = this.inventoryManager.getHotbarSlots();
    SlotGrid.createSlots(hotbarGrid, InventoryManager.HOTBAR_SLOTS, (idx) =>
      this.inventoryManager.getItem(hotbarSlots, idx)
    );

    // add selection listener
    this.hotbarSelectionHandlerRef =
      this.slotSelectionHandler(hotbarSlots).bind(this);
    hotbarGrid.addEventListener("pointerdown", this.hotbarSelectionHandlerRef);

    return hotbarGrid;
  }

  private dragMoveHandler = (evt: MouseEvent) => {
    if (this.inventoryManager.isDragging()) {
      this.dragItemElement.style.left = `${evt.pageX}px`;
      this.dragItemElement.style.top = `${evt.pageY}px`;
    }
  };

  private slotSelectionHandler = (items: Slot[]) => (e: PointerEvent) => {
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
  };

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
    const dragItemElement = document.createElement("div");
    const amountText = document.createElement("span");

    dragItemElement.id = "inventory-drag";
    dragItemElement.style.display = "none";
    dragItemElement.classList.add("item");

    amountText.classList.add("amount");
    dragItemElement.appendChild(amountText);

    document.body.appendChild(dragItemElement);

    // add mouse move listener
    this.dragMoveHandlerRef = this.dragMoveHandler.bind(this);
    document.addEventListener("mousemove", this.dragMoveHandlerRef);

    return dragItemElement;
  }

  private drawDraggingItem({ x, y }: THREE.Vector2) {
    const isDragging = this.inventoryManager.isDragging();

    if (isDragging) {
      const draggedItem = this.inventoryManager.getDraggedItem()!;

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
