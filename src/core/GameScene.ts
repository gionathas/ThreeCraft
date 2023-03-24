import * as THREE from "three";

export default class GameScene extends THREE.Scene {
  private static instance: GameScene | null;

  private constructor() {
    super();
  }

  public static getInstance(): GameScene {
    if (!this.instance) {
      this.instance = new GameScene();
    }
    return this.instance;
  }

  getMeshCount(): number {
    return this.children.length;
  }
}
