import Stats from "three/examples/jsm/libs/stats.module";
import EnvVars from "../config/EnvVars";
import KeyBindings from "../config/KeyBindings";
import GameScene from "../core/GameScene";
import Player from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { ContinentalMap, ErosionMap, PVMap } from "../maps/terrain";

/**
 * //TODO: add GUI threejs interactive panel
 *
 * //TODO: make this class a singleton, so that every class that need to display
 * some debug info can just call DebugInfo.getInstance().addDebugInfo("some info")
 *
 * //TODO: (refactor) instead of knowing about the player and terrain,
 * the debug info should take in input only the data it needs to display
 */
export default class DebugInfo {
  private scene: GameScene;
  private inputController: InputController;

  private player: Player;
  private terrain: Terrain;

  private isVisible: boolean;

  private debugPanel: HTMLElement;
  private fps: Stats;
  private mem: Stats;

  constructor(player: Player, terrain: Terrain) {
    this.scene = GameScene.getInstance();
    this.inputController = InputController.getInstance();

    this.player = player;
    this.terrain = terrain;

    this.isVisible = EnvVars.SHOW_DEBUG_INFO;

    this.debugPanel = this.initPanel();
    this.fps = this.initFpsStats();
    this.mem = this.initMemStats();
  }

  private initPanel() {
    const debugPanel = document.getElementById("debug-panel")!;
    debugPanel.style.display = this.isVisible ? "block" : "none";

    return debugPanel;
  }

  private initFpsStats() {
    const fps = Stats();
    fps.showPanel(0);
    fps.dom.style.cssText = "position:absolute;top:0px;left:0px;";
    fps.dom.style.display = this.isVisible ? "block" : "none";
    document.body.appendChild(fps.dom);

    return fps;
  }

  private initMemStats() {
    const mem = Stats();
    mem.showPanel(2);
    mem.dom.style.cssText = "position:absolute;top:50px;left:0px;";
    mem.dom.style.display = this.isVisible ? "block" : "none";
    document.body.appendChild(mem.dom);

    return mem;
  }

  update() {
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
    const state = this.player.getGroundState();

    const currentChunkId = this.player._currentChunkId;
    const totalChunks = this.terrain._totalChunks;
    const totalMesh = this.scene.getMeshCount();

    const continentalness = this.terrain._getContinentalness(px, pz);
    const erosion = this.terrain._getErosion(px, pz);
    const pv = this.terrain._getPV(px, pz);

    //FIXME this will run every frame
    // it's not ideal since it's a DOM operation
    this.debugPanel.innerHTML = `
    <p>State: ${state}</p>
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
    const hasSwitchedVisibility = this.inputController.hasJustPressedKey(
      KeyBindings.TOGGLE_DEBUG_INFO_KEY
    );

    if (hasSwitchedVisibility) {
      !this.isVisible ? this.show() : this.hide();
    }
  }

  show() {
    this.isVisible = true;

    this.debugPanel.style.display = "block";
    this.fps.dom.style.display = "block";
    this.mem.dom.style.display = "block";
  }

  hide() {
    this.isVisible = false;

    this.debugPanel.style.display = "none";
    this.fps.dom.style.display = "none";
    this.mem.dom.style.display = "none";
  }

  dispose() {
    this.isVisible = false;

    this.debugPanel.style.display = "none";
    this.debugPanel.childNodes.forEach((node) => node.remove());
    this.fps.dom.remove();
    this.mem.dom.remove();
  }
}
