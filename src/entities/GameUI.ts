import DebugInfo from "../ui/DebugInfo";
import Inventory from "../ui/Inventory";
import Player from "./Player";
import Terrain from "./Terrain";

export default class GameUI {
  private debugInfo: DebugInfo;
  private inventory: Inventory;

  constructor(player: Player, terrain: Terrain) {
    this.debugInfo = new DebugInfo(player, terrain);
    this.inventory = new Inventory(player.getInventoryManager());
  }

  update(dt: number) {
    this.debugInfo.update(dt);
  }
}
