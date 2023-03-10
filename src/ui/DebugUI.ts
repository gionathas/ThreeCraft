import Stats from "three/examples/jsm/libs/stats.module";
import EnvVars from "../config/EnvVars";
import KeyBindings from "../config/KeyBindings";
import Engine from "../core/Engine";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { ContinentalMap, ErosionMap, PVMap } from "../maps/terrain";

export default class DebugUI {
  private player: Player;
  private terrain: Terrain;

  private inputController: InputController;
  private isVisible!: boolean;

  private fps!: Stats;
  private mem!: Stats;

  private debugPanel!: HTMLElement;

  constructor(player: Player, terrain: Terrain) {
    this.inputController = InputController.getInstance();

    this.player = player;
    this.terrain = terrain;
    this.init();
  }

  private init() {
    this.debugPanel = document.getElementById("debugPanel")!;

    this.initStats();

    const initialVisibility = EnvVars.SHOW_DEBUG_UI;
    this.toggleVisibility(initialVisibility);
  }

  private initStats() {
    this.fps = Stats();
    this.fps.showPanel(0);
    this.fps.dom.style.cssText = "position:absolute;top:0px;left:0px;"; // set position
    document.body.appendChild(this.fps.dom);

    this.mem = Stats();
    this.mem.showPanel(2);
    this.mem.dom.style.cssText = "position:absolute;top:50px;left:0px;"; // set position
    document.body.appendChild(this.mem.dom);
  }

  update(dt: number) {
    this.updateDebugVisibility();
    this.updatePerformance();
    this.updateGameInfo();
  }

  private updatePerformance() {
    this.fps.update();
    this.mem.update();
  }

  private updateGameInfo() {
    if (!this.isVisible) return;

    const [px, py, pz] = this.player.getPosition().toArray();
    const [vx, vy, vz] = this.player.getVelocity().toArray();
    const orientation = this.player.getOrientation();

    const currentChunkId = this.player._currentChunkId;
    const totalChunks = this.terrain._totalChunks;
    const totalMesh = Engine.getInstance().getTotalMeshes();

    const continentalness = this.terrain._getContinentalness(px, pz);
    const erosion = this.terrain._getErosion(px, pz);
    const pv = this.terrain._getPV(px, pz);

    this.debugPanel.innerHTML = `
    <p>Orientation: ${orientation}</p>
    <p>x: ${px.toFixed(2)} y: ${py.toFixed(2)} z: ${pz.toFixed(2)}</p>
    <p>vx: ${vx.toFixed(2)} vy: ${vy.toFixed(2)} vz: ${vz.toFixed(2)}</p>
    <p>Current Chunk: (${currentChunkId})</p>
    <p>Chunks: ${totalChunks}</p>
    <p>Total Mesh: ${totalMesh}</p>
    <p>Erosion: ${erosion.toFixed(3)} | ${ErosionMap.getType(erosion)}</p>
    <p>PV: ${pv.toFixed(3)} | ${PVMap.getType(pv)}</p>
    <p>Continentalness: ${continentalness.toFixed(
      3
    )} | ${ContinentalMap.getType(continentalness)}</p>
    `;
  }

  private updateDebugVisibility() {
    const { isVisible } = this;

    if (
      this.inputController.hasJustPressedKey(KeyBindings.TOGGLE_DEBUG_UI_KEY)
    ) {
      this.toggleVisibility(!isVisible);
    }
  }

  private toggleVisibility(isVisible: boolean) {
    if (isVisible) {
      this.showDebugUI();
    } else {
      this.hideDebugUI();
    }
  }

  private showDebugUI() {
    this.isVisible = true;

    this.debugPanel.style.visibility = "visible";
    this.fps.dom.style.visibility = "visible";
    this.mem.dom.style.visibility = "visible";
  }

  private hideDebugUI() {
    this.isVisible = false;

    this.debugPanel.style.visibility = "hidden";
    this.fps.dom.style.visibility = "hidden";
    this.mem.dom.style.visibility = "hidden";
  }
}
