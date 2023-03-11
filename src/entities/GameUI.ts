import DebugUI from "../ui/DebugUI";
import Player from "./Player";
import Terrain from "./Terrain";

export default class GameUI {
  private debugUI: DebugUI;

  constructor(player: Player, terrain: Terrain) {
    this.debugUI = new DebugUI(player, terrain);
  }

  update(dt: number) {
    this.debugUI.update(dt);
  }
}
