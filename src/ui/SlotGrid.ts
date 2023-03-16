import { Item, Slot } from "../player/InventoryManager";
import Icons from "./Icons";

const dataSlotIndexAttr = "data-slot-index";

export default class SlotGrid {
  static drawGrid(
    grid: HTMLElement,
    amount: number,
    getItem: (index: number) => Slot
  ) {
    for (let i = 0; i < amount; i++) {
      const item = getItem(i);

      const slotElement = grid.querySelector(
        `[${dataSlotIndexAttr}="${i}"]`
      ) as HTMLElement;

      SlotGrid.drawSlot(slotElement, item);
    }
  }

  static createSlots(
    gridContainer: HTMLElement,
    amount: number,
    getSlot: (index: number) => Slot
  ) {
    // create the slots
    for (let i = 0; i < amount; i++) {
      const slotEl = document.createElement("div");
      const itemEl = document.createElement("div");
      const amountText = document.createElement("span");

      slotEl.classList.add("slot");
      slotEl.setAttribute(dataSlotIndexAttr, i.toString());

      // add item element inside slot
      itemEl.classList.add("item");
      slotEl.appendChild(itemEl);

      // add amount text inside item element
      amountText.classList.add("amount");
      itemEl.appendChild(amountText);

      gridContainer.appendChild(slotEl);

      const slot = getSlot(i);
      this.drawSlot(slotEl, slot);
    }
  }

  static getSlot(slotsGrid: HTMLElement, index: number): HTMLElement | null {
    return slotsGrid.querySelector(
      `[${dataSlotIndexAttr}="${index}"]`
    ) as HTMLElement | null;
  }

  static getSlotIndex(slotElement: HTMLElement) {
    return parseInt(slotElement.getAttribute(dataSlotIndexAttr) as string);
  }

  static drawSlot(slotElem: HTMLElement, slot: Slot) {
    const itemEl = slotElem.querySelector(".item") as HTMLElement;
    this.drawItem(itemEl, slot);
  }

  static drawItem(itemElement: HTMLElement, item: Item | null) {
    this.drawItemIcon(itemElement, item);
    this.drawItemAmount(itemElement, item);
  }

  private static drawItemIcon(itemElement: HTMLElement, item: Item | null) {
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

  private static drawItemAmount(itemElement: HTMLElement, item: Item | null) {
    const amountText = itemElement.querySelector(".amount") as HTMLElement;

    if (!item) {
      amountText.innerText = "";
    } else {
      amountText.innerText = item.amount > 1 ? item.amount.toString() : "";
    }
  }
}
