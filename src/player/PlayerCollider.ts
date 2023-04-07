import {
  AxesHelper,
  BoxGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
} from "three";
import EnvVars from "../config/EnvVars";
import Game from "../core/Game";
import GameScene from "../core/GameScene";
import PlayerConstants from "./PlayerConstants";
import PlayerControls from "./PlayerControls";

export default class PlayerCollider {
  private scene: GameScene;

  private collider: THREE.LineSegments;
  private playerControls: PlayerControls;

  constructor(playerControls: PlayerControls) {
    this.scene = Game.instance().getScene();
    this.playerControls = playerControls;

    this.collider = this.initCollider();
  }

  private initCollider() {
    const width = PlayerConstants.WIDTH;
    const height = PlayerConstants.HEIGHT;

    const boxGeom = new BoxGeometry(width, height, width);
    const mat = new LineBasicMaterial({ color: "white" });
    const edges = new EdgesGeometry(boxGeom);
    const axesHelpers = new AxesHelper();

    const collider = new LineSegments(edges, mat);
    collider.add(axesHelpers);

    // add the collider to the scene and update its visibility
    this.scene.add(collider);
    collider.visible = EnvVars.PLAYER_SHOW_BOUNDING_BOX;

    return collider;
  }

  update() {
    const playerPosition = this.playerControls.position;
    const centerY = this.playerControls.getCenterOfMassHeight();

    // update the collider position to the current player position,
    // except for the y axis which is set to the player's center of mass
    this.collider.position.set(playerPosition.x, centerY, playerPosition.z);
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
