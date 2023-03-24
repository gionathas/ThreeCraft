import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import EnvVars from "../config/EnvVars";
import KeyBindings from "../config/KeyBindings";
import Engine from "../core/Engine";
import { PlayerControlsMode } from "../entities/Player";
import Terrain from "../entities/Terrain";
import InputController from "../io/InputController";
import { Block } from "../terrain/block";
import { determineAngleQuadrant } from "../utils/helpers";
import Physics from "../utils/Physics";

export interface PlayerControlsProperties {
  width: number;
  height: number;
  horizontalSpeed: number;
  verticalSpeed: number;
  dampingFactor: number;
  physicsEnabled: boolean;
}

const simProps: PlayerControlsProperties = {
  width: 0.4,
  height: 1.8,
  horizontalSpeed: 0.6,
  verticalSpeed: 9.2,
  dampingFactor: 10,
  physicsEnabled: true,
};

const flyProps: PlayerControlsProperties = {
  ...simProps,
  physicsEnabled: false,
  horizontalSpeed: 4,
  verticalSpeed: 3,
};

const SLIDING_DEAD_ANGLE = 0.1;
const MIN_VELOCITY = 0.001;

/**
 * //TODO improve bottom collision detection or the area when the player
 * is currently hitting the ground
 *
 * //TODO detect collision in the mid area of the player hit box, currenyly a collision
 * is detected only when one of his bounding box apex hit a block
 *
 * //TODO extract some classes like one for managing collision detection
 */
export default class PlayerControls extends PointerLockControls {
  private inputController: InputController;
  private terrain: Terrain;

  private velocity: THREE.Vector3;
  private moveDirection: THREE.Vector3;

  private mode: PlayerControlsMode;
  private properties: PlayerControlsProperties;
  private state: "onGround" | "falling" | "jumping";

  private collider: THREE.LineSegments;

  private lockCbs: (() => void)[];
  private unlockCbs: (() => void)[];
  private onControlLockHandlerRef: () => void;
  private onControlUnlockHandlerRef: () => void;

  constructor(terrain: Terrain, mode: PlayerControlsMode) {
    super(Engine.getInstance().getCamera(), Engine.getInstance().getCanvas());
    this.terrain = terrain;
    this.inputController = InputController.getInstance();

    this.mode = mode;
    this.state = "falling";
    this.properties = this.getPlayerProps();

    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.collider = this.initCollider();

    // lock/unlock event handlers
    this.lockCbs = [];
    this.unlockCbs = [];
    this.onControlLockHandlerRef = this.onControlLockHandler.bind(this);
    this.onControlUnlockHandlerRef = this.onControlUnlockHandler.bind(this);
    this.onLock(this.onControlLockHandlerRef);
    this.onUnlock(this.onControlUnlockHandlerRef);
  }

  dispose() {
    this.collider.geometry.dispose();
    // @ts-ignore
    this.collider.material.dispose();

    this.lockCbs.forEach((cb) => this.removeEventListener("lock", cb));
    this.unlockCbs.forEach((cb) => this.removeEventListener("unlock", cb));
  }

  private onControlLockHandler() {
    this.inputController.enable();
  }

  private onControlUnlockHandler() {
    this.inputController.disable();
  }

  onLock(cb: () => void) {
    this.addEventListener("lock", cb);
    this.lockCbs.push(cb);
  }

  onUnlock(cb: () => void) {
    this.addEventListener("unlock", cb);
    this.unlockCbs.push(cb);
  }

  private initCollider() {
    const { width, height } = this.properties;
    const scene = Engine.getInstance().getScene();

    const boxGeom = new THREE.BoxGeometry(width, height, width);
    const mat = new THREE.LineBasicMaterial({ color: "white" });
    const edges = new THREE.EdgesGeometry(boxGeom);
    const axesHelpers = new THREE.AxesHelper();

    const collider = new THREE.LineSegments(edges, mat);
    collider.add(axesHelpers);

    if (EnvVars.PLAYER_SHOW_BOUNDING_BOX) {
      scene.add(collider);
    }

    return collider;
  }

  intersectsBlock(blockCollider: THREE.Box3) {
    this.collider.geometry.computeBoundingBox();

    // transform the hitbox bounding box to world space
    const boundingBox = this.collider.geometry.boundingBox;
    boundingBox?.applyMatrix4(this.collider.matrixWorld);

    return boundingBox?.intersectsBox(blockCollider) ?? false;
  }

  moveUp(distance: number) {
    this.position.y += distance;
  }

  moveX(distance: number) {
    this.position.x += distance;
  }

  moveZ(distance: number) {
    this.position.z += distance;
  }

  update(dt: number) {
    this.updateMode();

    this.updateHorizontalVelocity(dt);
    this.updateVerticalVelocity(dt);

    this.applyHorizontalCollisionResponse(dt);
    this.applyVerticalCollisionResponse();

    this.moveForward(this.velocity.z);
    this.moveUp(this.velocity.y);
    this.moveRight(this.velocity.x);

    this.applyVelocityDamping(dt);
    this.updateHitBox();
  }

  private updateMode() {
    const currentMode = this.mode;

    if (this.hasSwitchedMode()) {
      this.mode = currentMode === "sim" ? "fly" : "sim";
      this.properties = this.getPlayerProps();
    }
  }

  private updateHitBox() {
    this.collider?.position.set(
      this.position.x,
      this.position.y - this.height / 2,
      this.position.z
    );
  }

  private updateHorizontalVelocity(dt: number) {
    const { horizontalSpeed } = this.properties;

    this.moveDirection.x = this.getRightMovementDirection();
    this.moveDirection.z = this.getForwardMovementDirection();

    this.velocity.x += this.moveDirection.x * horizontalSpeed * dt;
    this.velocity.z += this.moveDirection.z * horizontalSpeed * dt;
  }

  private updateVerticalVelocity(dt: number) {
    const { verticalSpeed } = this.properties;

    switch (this.mode) {
      case "sim":
        // jump detected
        if (this.state === "onGround" && this.hasJumped()) {
          this.state = "jumping";
          this.velocity.y += verticalSpeed * dt;
        }

        break;
      case "fly":
        const upDirection = this.getFlyUpMovementDirection();
        this.velocity.y += upDirection * verticalSpeed * dt;
        break;
    }
  }

  private applyVelocityDamping(dt: number) {
    const { dampingFactor } = this.properties;

    this.velocity.x -= this.velocity.x * dampingFactor * dt;
    this.velocity.z -= this.velocity.z * dampingFactor * dt;

    // if its flying, we have no forces that will slow the player down
    // so we need to set one manually
    if (this.mode === "fly") {
      this.velocity.y -= this.velocity.y * dampingFactor * dt;
    } else {
      this.applyGravity(dt);
    }
  }

  private applyGravity(dt: number) {
    if (this.state === "falling") {
      this.velocity.y -= Physics.FALLING_GRAVITY * dt;
    }

    if (this.state === "jumping") {
      this.velocity.y -= Physics.JUMPING_GRAVITY * dt;
    }
  }

  private applyVerticalCollisionResponse() {
    const { physicsEnabled, height } = this.properties;

    if (!physicsEnabled) return;

    const isHittingGround = this.isHittingGround();
    const isTopColliding = this.isTopColliding();

    if (!isHittingGround) {
      this.state = this.velocity.y <= 0 ? "falling" : "jumping";

      // top collision after jumping
      if (this.state === "jumping" && isTopColliding) {
        this.velocity.y = 0;
      }
    } else {
      // if we have hit the ground after falling
      if (this.state === "falling") {
        this.state = "onGround";
        // move slightly below the surface to keep the collision with the ground
        const groundY =
          Math.floor(this.position.y - height) + Block.SIZE - 0.01;
        this.position.y = groundY + height;
        this.velocity.y = 0;
      }
    }
  }

  private isHittingGround() {
    const { width, height } = this.properties;
    const position = this.position;

    const isBlockBeneathSolid = this.terrain.isSolidBlock({
      x: position.x,
      y: position.y - height,
      z: position.z,
    });

    return isBlockBeneathSolid;
  }

  private isTopColliding() {
    const position = this.position;

    const isBlockAboveSolid = this.terrain.isSolidBlock({
      x: position.x,
      y: position.y,
      z: position.z,
    });

    return isBlockAboveSolid;
  }

  private applyHorizontalCollisionResponse(dt: number) {
    const { physicsEnabled } = this.properties;

    if (!physicsEnabled) return;

    const cameraDirection = this.getObject().getWorldDirection(
      new THREE.Vector3()
    );

    let cameraDirectionAngle = Math.atan2(cameraDirection.z, cameraDirection.x);
    // console.log(cameraDirectionAngle);

    const newVelocity = this.velocity.clone();

    const collisions = this.detectCollisions();
    if (collisions.front) {
      this.applyFrontCollisionResponse(cameraDirectionAngle, dt, newVelocity);
    }
    if (collisions.back) {
      this.applyBackCollisionResponse(cameraDirectionAngle, dt, newVelocity);
    }
    if (collisions.right) {
      this.applyRightCollisionResponse(cameraDirectionAngle, dt, newVelocity);
    }
    if (collisions.left) {
      this.applyLeftCollisionResponse(cameraDirectionAngle, dt, newVelocity);
    }

    //update the velocity
    this.velocity.copy(newVelocity);
  }

  private applyFrontCollisionResponse(
    cameraDirectionAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { width, height } = this.properties;
    const position = this.position.clone();

    const top = position.y;
    const bottom = position.y - height + 0.1;

    // moving forward
    if (this.velocity.z > MIN_VELOCITY) {
      // front right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );
        const rightBound = position.x - width / 2 - slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: rightBound,
          y: bottom,
          z: position.z,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: rightBound,
          y: top,
          z: position.z,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveX(-slidingVel);
        }
      }
      // front left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );
        const leftBound = position.x + width / 2 + slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: leftBound,
          y: bottom,
          z: position.z,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: leftBound,
          y: top,
          z: position.z,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveX(slidingVel);
        }
      }
    }

    // moving backward
    if (this.velocity.z < -MIN_VELOCITY) {
      // back right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const right = position.x + width / 2 + slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: right,
          y: bottom,
          z: position.z,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: right,
          y: top,
          z: position.z,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveX(slidingVel);
        }
      }

      // back left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const left = position.x - width / 2 - slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: left,
          y: bottom,
          z: position.z,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: left,
          y: top,
          z: position.z,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveX(-slidingVel);
        }
      }
    }

    // right side walking
    if (this.velocity.x > MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );

        const front = position.x + width / 2 + slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: bottom,
          z: position.z,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: top,
          z: position.z,
        });

        // push forward
        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveX(slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );

        const back = position.x - width / 2 - slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: bottom,
          z: position.z,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: top,
          z: position.z,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveX(-slidingVel);
        }
      }
    }

    // left side walking
    if (this.velocity.x < -MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );

        const front = position.x - width / 2 - slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: bottom,
          z: position.z,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: top,
          z: position.z,
        });

        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveX(-slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle - Math.PI / 2,
          dt
        );

        const back = position.x + width / 2 + slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: bottom,
          z: position.z,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: top,
          z: position.z,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveX(slidingVel);
        }
      }
    }
  }

  private applyBackCollisionResponse(
    cameraDirectionAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { width, height } = this.properties;
    const position = this.position.clone();

    const top = position.y;
    const bottom = position.y - height + 0.1;

    // moving forward
    if (this.velocity.z > MIN_VELOCITY) {
      // front right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );
        const rightBound = position.x + width / 2 + slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: rightBound,
          y: bottom,
          z: position.z,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: rightBound,
          y: top,
          z: position.z,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveX(slidingVel);
        }
      }
      // front left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );
        const leftBound = position.x - width / 2 - slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: leftBound,
          y: bottom,
          z: position.z,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: leftBound,
          y: top,
          z: position.z,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveX(-slidingVel);
        }
      }
    }

    // moving backward
    if (this.velocity.z < -MIN_VELOCITY) {
      // back right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const right = position.x - width / 2 + -slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: right,
          y: bottom,
          z: position.z,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: right,
          y: top,
          z: position.z,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveX(-slidingVel);
        }
      }

      // back left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const left = position.x + width / 2 + slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: left,
          y: bottom,
          z: position.z,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: left,
          y: top,
          z: position.z,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveX(slidingVel);
        }
      }
    }

    // right side walking
    if (this.velocity.x > MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle - Math.PI / 2,
          dt
        );

        const front = position.x - width / 2 - slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: bottom,
          z: position.z,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: top,
          z: position.z,
        });

        // push forward
        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveX(-slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );

        const back = position.x + width / 2 + slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: bottom,
          z: position.z,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: top,
          z: position.z,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveX(slidingVel);
        }
      }
    }

    // left side walking
    else if (this.velocity.x < -MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );

        const front = position.x + width / 2 + slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: bottom,
          z: position.z,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: front,
          y: top,
          z: position.z,
        });

        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveX(slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle - Math.PI / 2,
          dt
        );

        const back = position.x - width / 2 - slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: bottom,
          z: position.z,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: back,
          y: top,
          z: position.z,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveX(-slidingVel);
        }
      }
    }
  }

  private applyRightCollisionResponse(
    cameraDirectionAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { width, height } = this.properties;
    const position = this.position.clone();

    const top = position.y;
    const bottom = position.y - height + 0.1;

    // moving forward
    if (this.velocity.z > MIN_VELOCITY) {
      // front right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );
        const rightBound = position.z - width / 2 - slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: rightBound,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: rightBound,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveZ(-slidingVel);
        }
      }
      // front left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle - Math.PI / 2,
          dt
        );
        const leftBound = position.z + width / 2 + slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: leftBound,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: leftBound,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveZ(slidingVel);
        }
      }
    }

    // moving backward
    if (this.velocity.z < -MIN_VELOCITY) {
      // back right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );

        const right = position.z + width / 2 + slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: right,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: right,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveZ(slidingVel);
        }
      }

      // back left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle - Math.PI / 2,
          dt
        );

        const left = position.z - width / 2 - slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: left,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: left,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveZ(-slidingVel);
        }
      }
    }

    // right side walking
    if (this.velocity.x > MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const front = position.z + width / 2 + slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: front,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: front,
        });

        // push forward
        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveZ(slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const back = position.z - width / 2 - slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: back,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: back,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveZ(-slidingVel);
        }
      }
    }

    // left side walking
    else if (this.velocity.x < -MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const front = position.z - width / 2 - slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: front,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: front,
        });

        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveZ(-slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const back = position.z + width / 2 + slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: back,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: back,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveZ(slidingVel);
        }
      }
    }
  }

  private applyLeftCollisionResponse(
    cameraDirectionAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { width, height } = this.properties;
    const position = this.position.clone();

    const top = position.y;
    const bottom = position.y - height + 0.1;

    // moving forward
    if (this.velocity.z > MIN_VELOCITY) {
      // front right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );
        const rightBound = position.z + width / 2 + slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: rightBound,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: rightBound,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveZ(slidingVel);
        }
      }
      // front left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle - Math.PI / 2,
          dt
        );
        const leftBound = position.z - width / 2 - slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: leftBound,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: leftBound,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveZ(-slidingVel);
        }
      }
    }

    // moving backward
    if (this.velocity.z < -MIN_VELOCITY) {
      // back right slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle - Math.PI / 2,
          dt
        );

        const right = position.z - width / 2 - slidingVel;

        const isBottomRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: right,
        });

        const isTopRightBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: right,
        });

        if (!isBottomRightBlocked && !isTopRightBlocked) {
          this.moveZ(-slidingVel);
        }
      }

      // back left slide
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle + Math.PI / 2,
          dt
        );

        const left = position.z + width / 2 + slidingVel;

        const isBottomLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: left,
        });

        const isTopLeftBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: left,
        });

        if (!isTopLeftBlocked && !isBottomLeftBlocked) {
          this.moveZ(slidingVel);
        }
      }
    }

    // right side walking
    if (this.velocity.x > MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 3) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const front = position.z - width / 2 - slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: front,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: front,
        });

        // push forward
        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveZ(-slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 2) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const back = position.z + width / 2 + slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: back,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: back,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveZ(slidingVel);
        }
      }
    }

    // left side walking
    if (this.velocity.x < -MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(cameraDirectionAngle) === 4) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const front = position.z + width / 2 + slidingVel;

        const isBottomFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: front,
        });

        const isTopFrontBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: front,
        });

        if (!isBottomFrontBlocked && !isTopFrontBlocked) {
          this.moveZ(slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(cameraDirectionAngle) === 1) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(
          cameraDirectionAngle,
          dt
        );

        const back = position.z - width / 2 - slidingVel;

        const isBottomBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: bottom,
          z: back,
        });

        const isTopBackBlocked = this.terrain.isSolidBlock({
          x: position.x,
          y: top,
          z: back,
        });

        // push backward
        if (!isBottomBackBlocked && !isTopBackBlocked) {
          this.moveZ(-slidingVel);
        }
      }
    }
  }

  private detectCollisions() {
    return {
      front: this.isZSideColliding("front"),
      back: this.isZSideColliding("back"),
      left: this.isXSideColliding("left"),
      right: this.isXSideColliding("right"),
    };
  }

  private isZSideColliding(side: "back" | "front") {
    const { width, height } = this.properties;
    const position = this.position.clone();

    // slightly offset to distinguish from left or right collisions
    const left = position.x + width / 2 - 0.05;
    const right = position.x - width / 2 + 0.05;
    const xInc = left - right;

    // add an offset to avoid fake horizontal collision with the ground
    const bottom = position.y - height + 0.1;
    const top = position.y;
    const yInc = top - bottom;

    for (let y = bottom; y <= top; y += yInc) {
      for (let x = right; x <= left; x += xInc) {
        const isColliding = this.terrain.isSolidBlock({
          x,
          y,
          z: side === "front" ? position.z + width / 2 : position.z - width / 2,
        });

        if (isColliding) {
          return true;
        }
      }
    }

    return false;
  }

  private isXSideColliding(side: "right" | "left") {
    const { width, height } = this.properties;
    const position = this.position.clone();

    // slightly offset to distinguish from front or back collisions
    const front = position.z + width / 2 - 0.05;
    const back = position.z - width / 2 + 0.05;
    const zInc = front - back;

    // add an offset to avoid fake horizontal collision with the ground
    const bottom = position.y - height + 0.1;
    const top = position.y;
    const yInc = top - bottom;

    for (let y = bottom; y <= top; y += yInc) {
      for (let z = back; z <= front; z += zInc) {
        const isColliding = this.terrain.isSolidBlock({
          x: side === "left" ? position.x + width / 2 : position.x - width / 2,
          y,
          z,
        });

        if (isColliding) {
          return true;
        }
      }
    }

    return false;
  }

  private calculateSlidingVelocity(angle: number, dt: number) {
    const { horizontalSpeed } = this.properties;
    // even when the angle is near 90 degree or Math.PI
    // we still keep the player freezed against the wall
    if (
      Math.abs(angle - Math.PI / 2) <= SLIDING_DEAD_ANGLE ||
      Math.abs(angle + Math.PI / 2) <= SLIDING_DEAD_ANGLE
    ) {
      return 0;
    }

    // NOTE a bit too much magic here (should be refactored)
    const directionFactor = Math.abs(Math.cos(angle));
    return horizontalSpeed * directionFactor * dt * 6;
  }

  private hasJumped() {
    return this.inputController.hasJustPressedKey(KeyBindings.JUMP_KEY);
  }

  private hasSwitchedMode() {
    return this.inputController.hasJustPressedKey(
      KeyBindings.SWITCH_PLAYER_CONTROLS_MODE
    );
  }

  private getForwardMovementDirection() {
    return (
      (this.inputController.isPressingKey(KeyBindings.MOVE_FORWARD_KEY)
        ? 1
        : 0) +
      (this.inputController.isPressingKey(KeyBindings.MOVE_BACK_KEY) ? -1 : 0)
    );
  }

  private getRightMovementDirection() {
    return (
      (this.inputController.isPressingKey(KeyBindings.MOVE_RIGHT_KEY) ? 1 : 0) +
      (this.inputController.isPressingKey(KeyBindings.MOVE_LEFT_KEY) ? -1 : 0)
    );
  }

  private getFlyUpMovementDirection() {
    return (
      (this.inputController.isPressingKey(KeyBindings.JUMP_KEY) ? 1 : 0) +
      (this.inputController.isPressingKey(KeyBindings.SPRINT_KEY) ? -1 : 0)
    );
  }

  private getPlayerProps() {
    return this.mode === "sim" ? simProps : flyProps;
  }

  getCamera() {
    return this.getObject();
  }

  getVelocity() {
    return this.velocity;
  }

  get position() {
    return this.getObject().position;
  }

  get width() {
    return this.properties.width;
  }

  get height() {
    return this.properties.height;
  }
}
