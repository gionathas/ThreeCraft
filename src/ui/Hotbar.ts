import GameState from "../core/GameState";
import InventoryManager, { Slot } from "../player/InventoryManager";
import SlotGrid from "./SlotGrid";
import { UIComponent } from "./UIComponent";

export default class Hotbar implements UIComponent {
  private gameState: GameState;
  private inventoryManager: InventoryManager;

  private hotbarSlots: Slot[];

  private hotbarGrid!: HTMLElement;

  // callback refs
  private onNumSelectionHandlerRef: (event: KeyboardEvent) => void;
  private onWheelSelectionHandlerRef: (event: WheelEvent) => void;

  constructor(inventoryManager: InventoryManager) {
    this.gameState = GameState.getInstance();
    this.inventoryManager = inventoryManager;
    this.hotbarSlots = this.inventoryManager.getHotbarSlots();

    // ui
    this.hotbarGrid = document.getElementById("hotbar")!;
    this.createHotbarSlots();

    // callback refs and listeners
    this.onNumSelectionHandlerRef = this.onNumSelectionHandler.bind(this);
    this.onWheelSelectionHandlerRef = this.onWheelSelectionHandler.bind(this);
    this.initListeners();
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

  private initListeners() {
    document.addEventListener("keydown", this.onNumSelectionHandlerRef);
    document.addEventListener("wheel", this.onWheelSelectionHandlerRef);

    this.inventoryManager.onHotbarChange((items) => {
      SlotGrid.drawGrid(
        this.hotbarGrid,
        InventoryManager.HOTBAR_SLOTS,
        (index) => this.inventoryManager.getItem(items, index)
      );
    });
  }

  private onNumSelectionHandler(event: KeyboardEvent) {
    if (!this.gameState.isRunning()) {
      return;
    }

    const numPressed = parseInt(event.key);

    if (!isNaN(numPressed)) {
      this.updateSelectedSlotMarker(numPressed - 1);
    }
  }

  private onWheelSelectionHandler(event: WheelEvent) {
    if (!this.gameState.isRunning()) {
      return;
    }

    const isScrollingUp = event.deltaY < 0;
    const isScrollingDown = event.deltaY > 0;
    const selectedIndex = this.inventoryManager.getSelectedIndex();

    if (isScrollingUp) {
      this.updateSelectedSlotMarker(selectedIndex + 1);
    }

    if (isScrollingDown) {
      this.updateSelectedSlotMarker(selectedIndex - 1);
    }
  }

  dispose(): void {
    this.hide();
    SlotGrid.removeSlots(this.hotbarGrid);
    document.removeEventListener("keydown", this.onNumSelectionHandlerRef);
    document.removeEventListener("wheel", this.onWheelSelectionHandlerRef);
  }

  show() {
    this.hotbarGrid.style.display = "flex";
  }

  hide() {
    this.hotbarGrid.style.display = "none";
  }
}
