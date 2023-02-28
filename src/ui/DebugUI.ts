import Stats from "three/examples/jsm/libs/stats.module";
import EnvVars from "../config/EnvVars";
import KeyBindings from "../config/KeyBindings";
import Engine from "../core/Engine";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import ContinentalMap from "../maps/ContinentalMap";
import ErosionMap from "../maps/ErosionMap";
import PVMap from "../maps/PVMap";

export default class DebugUI {
  private player: Player;
  private terrain: Terrain;

  private inputController: InputController;
  private isVisible!: boolean;

  private debugUI!: HTMLElement;
  private fps!: Stats;
  private mem!: Stats;

  constructor(player: Player, terrain: Terrain) {
    this.inputController = InputController.getInstance();
    this.player = player;
    this.terrain = terrain;
    this.init();
  }

  init() {
    this.debugUI = document.getElementById("debugUI")!;

    this.fps = Stats();
    this.fps.showPanel(0);
    this.fps.dom.style.cssText = "position:absolute;top:0px;left:0px;"; // set position
    document.body.appendChild(this.fps.dom);

    this.mem = Stats();
    this.mem.showPanel(2);
    this.mem.dom.style.cssText = "position:absolute;top:50px;left:0px;"; // set position
    document.body.appendChild(this.mem.dom);

    const initialVisibility = EnvVars.SHOW_DEBUG_UI;
    this.toggleVisibility(initialVisibility);
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
    const { debugUI } = this;

    const [px, py, pz] = this.player.getPosition().toArray();
    const [vx, vy, vz] = this.player.getVelocity().toArray();
    const orientation = this.player.getOrientation();

    // const targetBlock = this.player.getTargetBlock();
    const currentChunkId = this.player._currentChunkId;
    const totalChunks = this.terrain._totalChunks;
    const totalMesh = Engine.getInstance().getTotalMeshes();

    const continentalness = this.terrain._getContinentalness(px, pz);
    const erosion = this.terrain._getErosion(px, pz);
    const pv = this.terrain._getPV(px, pz);

    debugUI!.innerHTML = `<p>Orientation: ${orientation}</p>`;
    debugUI!.innerHTML += `<p>x: ${px.toFixed(2)} y: ${py.toFixed(
      2
    )} z: ${pz.toFixed(2)}</p>`;
    debugUI!.innerHTML += `<p>vx: ${vx.toFixed(2)} vy: ${vy.toFixed(
      2
    )} vz: ${vz.toFixed(2)}</p>`;

    // infoUI!.innerHTML += `<p>Target Block: (${targetBlock?.position.map(
    //   (block) => Math.floor(block)
    // )})</p>`;
    debugUI!.innerHTML += `<p>Current Chunk: (${currentChunkId})</p>`;
    debugUI!.innerHTML += `<p>Chunks: ${totalChunks}</p>`;
    debugUI!.innerHTML += `<p>Total Mesh: ${totalMesh}</p>`;
    debugUI!.innerHTML += `<p>Erosion: ${erosion.toFixed(
      3
    )} | ${ErosionMap.getType(erosion)}</p>`;
    debugUI!.innerHTML += `<p>PV: ${pv.toFixed(3)} | ${PVMap.getType(pv)}</p>`;
    debugUI!.innerHTML += `<p>Continentalness: ${continentalness.toFixed(
      3
    )} | ${ContinentalMap.getType(continentalness)}</p>`;
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
    this.debugUI.style.visibility = "visible";
    this.fps.dom.style.visibility = "visible";
    this.mem.dom.style.visibility = "visible";
  }

  private hideDebugUI() {
    this.isVisible = false;
    this.debugUI.style.visibility = "hidden";
    this.fps.dom.style.visibility = "hidden";
    this.mem.dom.style.visibility = "hidden";
  }
}
