import * as THREE from "three";
import InventoryManager, { Slot } from "../player/InventoryManager";

const dataSlotIndexAttr = "data-slot-index";

export default class Inventory {
  private inventoryManager: InventoryManager;

  public isOpen: boolean;

  // parent html element
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

    this.inventoryElement.style.display = "flex";
    this.isOpen = true;
  }

  hideInventory() {
    // safe stop dragging
    this.inventoryManager.endDrag();

    // hide the inventory
    this.inventoryElement.style.display = "none";
    this.dragItemElement.style.display = "none";
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

  private syncSlots(parentElement: HTMLElement, amount: number, items: Slot[]) {
    for (let i = 0; i < amount; i++) {
      const item = this.inventoryManager.getItem(items, i);
      const slotElement = parentElement.querySelector(
        `[${dataSlotIndexAttr}="${i}"]`
      ) as HTMLElement;

      this.drawSlot(slotElement, item);
    }
  }

  private initInventoryElement() {
    const inventoryElement = document.getElementById("inventory");

    if (!inventoryElement) {
      throw new Error("Inventory not found");
    }

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
    this.createSlots(
      craftingSlotsEl,
      InventoryManager.CRAFTING_SLOTS,
      this.inventoryManager.getCraftingSlots(),
      (index) => {
        console.log("left click on crafting slot", index);
      },
      (index) => {
        console.log("right click on crafting slot", index);
      }
    );
  }

  private createInventorySlots() {
    const inventorySlotsEl = document.getElementById("inventory-slots");

    if (!inventorySlotsEl) {
      throw new Error("Inventory slots markup not found");
    }

    this.inventorySlotsEl = inventorySlotsEl;

    const inventoryItems = this.inventoryManager.getInventoryItems();
    this.createSlots(
      inventorySlotsEl,
      InventoryManager.INVENTORY_SLOTS,
      inventoryItems,
      (slotEl, index) => {},
      (index) => {
        console.log("right click on inventory slot", index);
      }
    );
  }

  private createHotbarSlots() {
    const hotbarSlotsEl = document.getElementById("inventory-hotbar-slots");

    if (!hotbarSlotsEl) {
      throw new Error("Inventory markup not found");
    }

    this.hotbarSlotsEl = hotbarSlotsEl;

    // add hotbar slots
    this.createSlots(
      hotbarSlotsEl,
      InventoryManager.HOTBAR_SLOTS,
      this.inventoryManager.getHotbarItems(),
      (index) => {
        console.log("left click on hotbar slot", index);
      },
      (index) => {
        console.log("right click on hotbar slot", index);
      }
    );
  }

  private createSlots(
    parentElement: HTMLElement,
    amount: number,
    items: Slot[],
    onLeftClick: (slotElement: HTMLElement, index: number) => void,
    onRightClick: (slotElement: HTMLElement, index: number) => void
  ) {
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

      parentElement.appendChild(slot);

      const item = this.inventoryManager.getItem(items, i);
      this.drawSlot(slot, item);
    }

    parentElement.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const isLeft = e.button === 0;
      const isRight = e.button === 2;

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

        if (isLeft) {
          this.handleLeftClick(slotElement, items, parseInt(slotIndex), cursor);
        }
      }
    });
  }

  private handleLeftClick(
    slotElement: HTMLElement,
    items: Slot[],
    index: number,
    cursor: THREE.Vector2
  ) {
    const isDragging = this.inventoryManager.isDragging();

    if (isDragging) {
      this.inventoryManager.placeDraggedItem(items, index);
      this.drawDraggingItem(cursor);

      // re draw the slot
      const item = this.inventoryManager.getItem(items, index);
      this.drawSlot(slotElement, item);
    } else {
      // if the selected slot is not empty, we begin dragging the item
      const hasItem = this.inventoryManager.getItem(items, index);

      if (hasItem) {
        // remove the selected item from the slot
        this.drawSlot(slotElement, null);

        // start dragging the item
        this.inventoryManager.beginDrag(items, index);
        this.drawDraggingItem(cursor);
      }
    }
  }

  private drawSlot(slot: HTMLElement, item: Slot) {
    const itemEl = slot.querySelector(".item") as HTMLElement;
    const amountText = slot.querySelector(".amount") as HTMLElement;

    if (item) {
      //FIXME
      itemEl.style.visibility = "visible";
      amountText.innerText = item.amount.toString();
    } else {
      //FIXME
      itemEl.style.visibility = "hidden";
      amountText.innerText = "";
    }
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

      //get the amount text element
      const amountText = this.dragItemElement.querySelector(
        ".amount"
      ) as HTMLElement;
      amountText.innerText = draggedItem.amount.toString();
    } else {
      // hide the dragged item element
      this.dragItemElement.style.display = "none";
    }
  }
}
