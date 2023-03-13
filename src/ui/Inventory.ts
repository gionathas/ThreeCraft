import InventoryManager from "../player/InventoryManager";

const dataSlotIndexAttr = "data-slot-index";

export default class Inventory {
  private inventoryManager: InventoryManager;

  private isOpen: boolean;

  // parent html element
  private inventoryElement!: HTMLElement;
  private craftingSlotsEl!: HTMLElement;
  private inventorySlotsEl!: HTMLElement;
  private hotbarSlotsEl!: HTMLElement;

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;

    this.isOpen = false;
    this.initInventoryElement();

    this.initCraftingSlots();
    this.initInventorySlots();
    this.initHotbarSlots();
    this.initEventListeners();
  }

  private initEventListeners() {
    // on key press T open inventory
    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyT":
          this.isOpen ? this.closeInventory() : this.openInventory();
          this.isOpen = !this.isOpen;
          break;
      }
    });
  }

  openInventory() {
    this.inventoryManager.openInventory();
    // set display to flex
    this.inventoryElement.style.display = "flex";
  }

  closeInventory() {
    this.inventoryManager.closeInventory();
    // set display to none
    this.inventoryElement.style.display = "none";
  }

  private initInventoryElement() {
    const inventoryElement = document.getElementById("inventory");

    if (!inventoryElement) {
      throw new Error("Inventory not found");
    }

    this.inventoryElement = inventoryElement;
    this.inventoryElement.style.display = "none";
  }

  private initCraftingSlots() {
    const craftingSlotsEl = document.getElementById("crafting-slots");

    if (!craftingSlotsEl) {
      throw new Error("Inventory markup not found");
    }

    this.craftingSlotsEl = craftingSlotsEl;

    // add inventory slots
    for (let i = 0; i < InventoryManager.CRAFTING_SLOTS; i++) {
      const slot = document.createElement("div");
      slot.classList.add("slot");
      slot.setAttribute(dataSlotIndexAttr, i.toString());
      craftingSlotsEl.appendChild(slot);
    }

    // add event listeners
    craftingSlotsEl.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("slot")) {
        const slotIndex = target.getAttribute(dataSlotIndexAttr);

        if (slotIndex) {
          console.log("clicked on crafting slot", slotIndex);
        }
      }
    });
  }

  private initInventorySlots() {
    const inventorySlotsEl = document.getElementById("inventory-slots");

    if (!inventorySlotsEl) {
      throw new Error("Inventory slots markup not found");
    }

    this.inventorySlotsEl = inventorySlotsEl;

    // add inventory slots
    for (let i = 0; i < InventoryManager.INVENTORY_SLOTS; i++) {
      const slot = document.createElement("div");
      slot.classList.add("slot");
      slot.setAttribute(dataSlotIndexAttr, i.toString());
      inventorySlotsEl.appendChild(slot);
    }

    // add event listeners
    inventorySlotsEl.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("slot")) {
        const slotIndex = target.getAttribute(dataSlotIndexAttr);

        if (slotIndex) {
          console.log("clicked on inventory slot", slotIndex);
        }
      }
    });
  }

  private initHotbarSlots() {
    const hotbarSlotsEl = document.getElementById("inventory-hotbar-slots");

    if (!hotbarSlotsEl) {
      throw new Error("Inventory markup not found");
    }

    this.hotbarSlotsEl = hotbarSlotsEl;

    // add inventory slots
    for (let i = 0; i < InventoryManager.HOTBAR_SLOTS; i++) {
      const slot = document.createElement("div");
      slot.classList.add("slot");
      slot.setAttribute(dataSlotIndexAttr, i.toString());
      hotbarSlotsEl.appendChild(slot);
    }

    // add event listeners
    hotbarSlotsEl.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("slot")) {
        const slotIndex = target.getAttribute(dataSlotIndexAttr);

        if (slotIndex) {
          console.log("clicked on hotbar slot", slotIndex);
        }
      }
    });
  }

  private clear() {
    // TODO remove all event listeners
    // TODO remove all slots html elements
  }
}
