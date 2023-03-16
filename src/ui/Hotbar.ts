import InventoryManager, { Slot } from "../player/InventoryManager";
import SlotGrid from "./SlotGrid";

export default class Hotbar {
  private inventoryManager: InventoryManager;

  private hotbarSlots: Slot[];

  private hotbarGrid!: HTMLElement;

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
    this.hotbarSlots = this.inventoryManager.getHotbarSlots();

    // ui
    this.initHotbarGrid();
    this.createHotbarSlots();

    // listeners
    this.initHotbarChangeListener();
    this.initSelectionListener();
  }

  private initHotbarGrid() {
    const hotbarElement = document.getElementById("hotbar");

    if (!hotbarElement) {
      throw new Error("Hotbar markup not found");
    }

    this.hotbarGrid = hotbarElement;
  }

  private createHotbarSlots() {
    // creating the slots
    SlotGrid.createSlots(
      this.hotbarGrid,
      InventoryManager.HOTBAR_SLOTS,
      (index) => this.inventoryManager.getItem(this.hotbarSlots, index)
    );

    // draw the selected slot marker
    this.drawSelectedSlotMarker();
  }

  private initSelectionListener() {
    window.addEventListener("keydown", (event) => {
      const numPressed = parseInt(event.key);

      if (!isNaN(numPressed)) {
        this.updateSelectedSlotMarker(numPressed - 1);
      }
    });

    window.addEventListener("wheel", (event) => {
      event.preventDefault();
      const isScrollingUp = event.deltaY < 0;
      const isScrollingDown = event.deltaY > 0;
      const selectedIndex = this.inventoryManager.getSelectedIndex();

      if (isScrollingUp) {
        this.updateSelectedSlotMarker(selectedIndex + 1);
      }

      if (isScrollingDown) {
        this.updateSelectedSlotMarker(selectedIndex - 1);
      }
    });
  }

  private updateSelectedSlotMarker(newIndex: number) {
    const currentSelectedSlot = SlotGrid.getSlot(
      this.hotbarGrid,
      this.inventoryManager.getSelectedIndex()
    );
    currentSelectedSlot?.classList.remove("selected");

    this.inventoryManager.setSelectedIndex(newIndex);
    this.drawSelectedSlotMarker();
  }

  private drawSelectedSlotMarker() {
    const selectedSlotEl = SlotGrid.getSlot(
      this.hotbarGrid,
      this.inventoryManager.getSelectedIndex()
    );

    if (selectedSlotEl) {
      selectedSlotEl.classList.add("selected");
    }
  }

  private initHotbarChangeListener() {
    this.inventoryManager.onHotbarChange((items) => {
      SlotGrid.drawGrid(
        this.hotbarGrid,
        InventoryManager.HOTBAR_SLOTS,
        (index) => this.inventoryManager.getItem(items, index)
      );
    });
  }
}
