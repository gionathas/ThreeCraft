import { Item, Slot } from "../player/InventoryManager";
import Icons from "./Icons";

const dataSlotIndexAttr = "data-slot-index";

export default class SlotGrid {
  static drawSlots(
    slotsGrid: HTMLElement,
    amount: number,
    getItem: (index: number) => Slot
  ) {
    for (let i = 0; i < amount; i++) {
      const item = getItem(i);

      const slotElement = slotsGrid.querySelector(
        `[${dataSlotIndexAttr}="${i}"]`
      ) as HTMLElement;

      SlotGrid.drawSlot(slotElement, item);
    }
  }

  static createSlots(
    parentContainer: HTMLElement,
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

      parentContainer.appendChild(slotEl);

      const slot = getSlot(i);
      this.drawSlot(slotEl, slot);
    }
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
