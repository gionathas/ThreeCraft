import * as THREE from "three";
import EnvVars from "../config/EnvVars";
import GameScene from "../core/GameScene";
import Player from "../entities/Player";

export default class PlayerCollider {
  private scene: GameScene;

  private collider: THREE.LineSegments;

  constructor() {
    this.scene = GameScene.getInstance();
    this.collider = this.initCollider();
  }

  private initCollider() {
    const width = Player.WIDTH;
    const height = Player.HEIGHT;

    const boxGeom = new THREE.BoxGeometry(width, height, width);
    const mat = new THREE.LineBasicMaterial({ color: "white" });
    const edges = new THREE.EdgesGeometry(boxGeom);
    const axesHelpers = new THREE.AxesHelper();

    const collider = new THREE.LineSegments(edges, mat);
    collider.add(axesHelpers);

    // add the collider to the scene and update its visibility
    this.scene.add(collider);
    collider.visible = EnvVars.PLAYER_SHOW_BOUNDING_BOX;

    return collider;
  }

  update(playerPosition: THREE.Vector3) {
    // update the collider position to the current player position,
    // except for the y axis which is set to the player's center of mass
    this.collider.position.set(
      playerPosition.x,
      playerPosition.y - Player.HEIGHT / 2,
      playerPosition.z
    );
  }

  intersectsWith(entityCollider: THREE.Box3) {
    this.collider.geometry.computeBoundingBox();

    let boundingBox = this.collider.geometry.boundingBox;

    if (boundingBox) {
      // transform the collider bounding box to world space
      boundingBox.applyMatrix4(this.collider.matrixWorld);
      return boundingBox.intersectsBox(entityCollider);
    }

    return false;
  }

  dispose() {
    this.scene.remove(this.collider);
    this.collider.geometry.dispose();
    // @ts-ignore
    this.collider.material.dispose();
  }
}
