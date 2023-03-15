import * as THREE from "three";
import InventoryManager, { Item, Slot } from "../player/InventoryManager";
import Icons from "./Icons";

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
    this.createDragItemElement();
    this.createCraftingSlots();
    this.createInventorySlots();
    this.createHotbarSlots();
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
    // safe stop dragging
    this.inventoryManager.endDrag();

    // hide the inventory
    this.overlayElement.style.display = "none";
    this.dragItemElement.style.display = "none";
    this.inventoryElement.style.display = "none";
    this.isOpen = false;
  }

  private syncInventory() {
    this.inventoryManager.isDirty = false;

    // sync crafting slots
    this.syncSlots(
      this.craftingSlotsEl,
      InventoryManager.CRAFTING_SLOTS,
      this.inventoryManager.getCraftingSlots()
    );

    // sync inventory slots
    this.syncSlots(
      this.inventorySlotsEl,
      InventoryManager.INVENTORY_SLOTS,
      this.inventoryManager.getInventoryItems()
    );

    // sync hotbar slots
    this.syncSlots(
      this.hotbarSlotsEl,
      InventoryManager.HOTBAR_SLOTS,
      this.inventoryManager.getHotbarItems()
    );
  }

  private syncSlots(slotsArea: HTMLElement, amount: number, items: Slot[]) {
    for (let i = 0; i < amount; i++) {
      const item = this.inventoryManager.getItem(items, i);
      const slotElement = slotsArea.querySelector(
        `[${dataSlotIndexAttr}="${i}"]`
      ) as HTMLElement;

      this.drawSlot(slotElement, item);
    }
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

  private createCraftingSlots() {
    const craftingSlotsEl = document.getElementById("crafting-slots");

    if (!craftingSlotsEl) {
      throw new Error("Inventory markup not found");
    }

    this.craftingSlotsEl = craftingSlotsEl;

    // add crafting slots
    this.createSlotGrid(
      craftingSlotsEl,
      InventoryManager.CRAFTING_SLOTS,
      this.inventoryManager.getCraftingSlots()
    );
  }

  private createInventorySlots() {
    const inventorySlotsEl = document.getElementById("inventory-slots");

    if (!inventorySlotsEl) {
      throw new Error("Inventory slots markup not found");
    }

    this.inventorySlotsEl = inventorySlotsEl;

    const inventoryItems = this.inventoryManager.getInventoryItems();
    this.createSlotGrid(
      inventorySlotsEl,
      InventoryManager.INVENTORY_SLOTS,
      inventoryItems
    );
  }

  private createHotbarSlots() {
    const hotbarSlotsEl = document.getElementById("inventory-hotbar-slots");

    if (!hotbarSlotsEl) {
      throw new Error("Inventory markup not found");
    }

    this.hotbarSlotsEl = hotbarSlotsEl;

    // add hotbar slots
    this.createSlotGrid(
      hotbarSlotsEl,
      InventoryManager.HOTBAR_SLOTS,
      this.inventoryManager.getHotbarItems()
    );
  }

  private createSlotGrid(slotGrid: HTMLElement, amount: number, items: Slot[]) {
    // create the slots
    for (let i = 0; i < amount; i++) {
      const slot = document.createElement("div");
      const itemEl = document.createElement("div");
      const amountText = document.createElement("span");

      slot.classList.add("slot");
      slot.setAttribute(dataSlotIndexAttr, i.toString());

      // add item element inside slot
      itemEl.classList.add("item");
      slot.appendChild(itemEl);

      // add amount text inside item element
      amountText.classList.add("amount");
      itemEl.appendChild(amountText);

      slotGrid.appendChild(slot);

      const item = this.inventoryManager.getItem(items, i);
      this.drawSlot(slot, item);
    }

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
      this.inventoryManager.placeDraggedItem(items, index, isM1 ? false : true);
      this.drawDraggingItem(cursor);

      // re draw the slot
      const item = this.inventoryManager.getItem(items, index);
      this.drawSlot(slotElement, item);
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
        this.drawSlot(slotElement, slot);
        // draw the dragged item
        this.drawDraggingItem(cursor);
      }
    }
  }

  private drawSlot(slotElem: HTMLElement, slot: Slot) {
    const itemEl = slotElem.querySelector(".item") as HTMLElement;
    this.drawItemIcon(itemEl, slot);
    this.drawItemAmount(slotElem, slot);
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
      this.drawItemIcon(this.dragItemElement, draggedItem);
      this.drawItemAmount(this.dragItemElement, draggedItem);
    } else {
      // hide the dragged item element
      this.dragItemElement.style.display = "none";
    }
  }

  private drawItemIcon(itemElement: HTMLElement, item: Item | null) {
    if (!item) {
      itemElement.style.background = "";
      itemElement.style.backgroundPosition = "";
      return;
    }

    const urlPath = Icons.getBlockIconUrlPath(item.block);
    const { x, y } = Icons.getBlockIconPosition(item.block);

    itemElement.style.background = `url(${urlPath})`;
    itemElement.style.backgroundPosition = `-${x}px -${y}px`;
  }

  private drawItemAmount(itemElement: HTMLElement, item: Item | null) {
    const amountText = itemElement.querySelector(".amount") as HTMLElement;

    if (!item) {
      amountText.innerText = "";
    } else {
      amountText.innerText = item.amount > 1 ? item.amount.toString() : "";
    }
  }
}
