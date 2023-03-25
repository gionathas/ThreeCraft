import * as THREE from "three";
import Player, { PlayerControlsMode } from "../entities/Player";
import Terrain from "../entities/Terrain";
import { Block } from "../terrain/block";
import { determineAngleQuadrant } from "../utils/helpers";
import Physics from "../utils/Physics";
import PlayerController from "./PlayerController";
import PlayerControls from "./PlayerControls";

export interface PlayerProperties {
  horizontalSpeed: number;
  verticalSpeed: number;
  dampingFactor: number;
  physicsEnabled: boolean;
}

const simProps: PlayerProperties = {
  horizontalSpeed: 0.6,
  verticalSpeed: 9.2,
  dampingFactor: 10,
  physicsEnabled: true,
};

const flyProps: PlayerProperties = {
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
 * //TODO sliding need to be improved, the ideal would be using vector projection onto a plane
 *
 * //TODO extract some classes like one for managing collision detection
 */
export default class PlayerPhysics {
  private terrain: Terrain;

  private velocity: THREE.Vector3;
  private moveDirection: THREE.Vector3;

  private playerControls: PlayerControls;
  private playerController: PlayerController;
  private mode: PlayerControlsMode;
  private properties: PlayerProperties;
  private state: "onGround" | "falling" | "jumping";

  constructor(
    playerController: PlayerController,
    playerControls: PlayerControls,
    terrain: Terrain,
    initialMode: PlayerControlsMode
  ) {
    this.playerController = playerController;
    this.playerControls = playerControls;
    this.terrain = terrain;

    this.mode = initialMode;
    this.state = "falling";
    this.properties = this.getPlayerProperties();

    this.moveDirection = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
  }

  update(dt: number) {
    const { playerControls } = this;
    this.updateMode();

    this.updateHorizontalVelocity(dt);
    this.updateVerticalVelocity(dt);

    this.applyHorizontalCollisionResponse(dt);
    this.applyVerticalCollisionResponse();

    // update player position
    playerControls.moveForward(this.velocity.z);
    playerControls.moveUp(this.velocity.y);
    playerControls.moveRight(this.velocity.x);

    this.applyVelocityDamping(dt);
  }

  private updateMode() {
    const currentMode = this.mode;

    if (this.playerController.hasSwitchedControls()) {
      this.mode = currentMode === "sim" ? "fly" : "sim";
      this.properties = this.getPlayerProperties();
    }
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
        const hasJumped = this.playerController.hasJumped();
        // jump detected
        if (this.state === "onGround" && hasJumped) {
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
    const { physicsEnabled } = this.properties;
    const height = this.height;

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
    const height = this.height;
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

    const lookDirection = this.playerControls.getLookDirection();
    let lookDirAngle = Math.atan2(lookDirection.z, lookDirection.x);

    const newVelocity = this.velocity.clone();

    const collisions = this.detectCollisions();
    if (collisions.front) {
      this.applyFrontCollisionResponse(lookDirAngle, dt, newVelocity);
    }
    if (collisions.back) {
      this.applyBackCollisionResponse(lookDirAngle, dt, newVelocity);
    }
    if (collisions.right) {
      this.applyRightCollisionResponse(lookDirAngle, dt, newVelocity);
    }
    if (collisions.left) {
      this.applyLeftCollisionResponse(lookDirAngle, dt, newVelocity);
    }

    //update the velocity
    this.velocity.copy(newVelocity);
  }

  private applyFrontCollisionResponse(
    cameraDirectionAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { playerControls, width, height } = this;
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
          playerControls.moveX(-slidingVel);
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
          playerControls.moveX(slidingVel);
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
          playerControls.moveX(slidingVel);
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
          playerControls.moveX(-slidingVel);
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
          playerControls.moveX(slidingVel);
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
          playerControls.moveX(-slidingVel);
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
          playerControls.moveX(-slidingVel);
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
          playerControls.moveX(slidingVel);
        }
      }
    }
  }

  private applyBackCollisionResponse(
    cameraDirectionAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { width, height, playerControls } = this;
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
          playerControls.moveX(slidingVel);
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
          playerControls.moveX(-slidingVel);
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
          playerControls.moveX(-slidingVel);
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
          playerControls.moveX(slidingVel);
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
          playerControls.moveX(-slidingVel);
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
          playerControls.moveX(slidingVel);
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
          playerControls.moveX(slidingVel);
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
          playerControls.moveX(-slidingVel);
        }
      }
    }
  }

  private applyRightCollisionResponse(
    lookDirAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { width, height, playerControls } = this;
    const position = this.position.clone();

    const top = position.y;
    const bottom = position.y - height + 0.1;

    // moving forward
    if (this.velocity.z > MIN_VELOCITY) {
      // front right slide
      if (determineAngleQuadrant(lookDirAngle) === 3) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle + Math.PI / 2,
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
          playerControls.moveZ(-slidingVel);
        }
      }
      // front left slide
      if (determineAngleQuadrant(lookDirAngle) === 4) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle - Math.PI / 2,
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
          playerControls.moveZ(slidingVel);
        }
      }
    }

    // moving backward
    if (this.velocity.z < -MIN_VELOCITY) {
      // back right slide
      if (determineAngleQuadrant(lookDirAngle) === 2) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle + Math.PI / 2,
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
          playerControls.moveZ(slidingVel);
        }
      }

      // back left slide
      if (determineAngleQuadrant(lookDirAngle) === 1) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle - Math.PI / 2,
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
          playerControls.moveZ(-slidingVel);
        }
      }
    }

    // right side walking
    if (this.velocity.x > MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(lookDirAngle) === 1) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(lookDirAngle) === 4) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(-slidingVel);
        }
      }
    }

    // left side walking
    else if (this.velocity.x < -MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(lookDirAngle) === 2) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(-slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(lookDirAngle) === 3) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(slidingVel);
        }
      }
    }
  }

  private applyLeftCollisionResponse(
    lookDirAngle: number,
    dt: number,
    newVelocity: THREE.Vector3
  ) {
    const { width, height, playerControls } = this;
    const position = this.position.clone();

    const top = position.y;
    const bottom = position.y - height + 0.1;

    // moving forward
    if (this.velocity.z > MIN_VELOCITY) {
      // front right slide
      if (determineAngleQuadrant(lookDirAngle) === 1) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle + Math.PI / 2,
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
          playerControls.moveZ(slidingVel);
        }
      }
      // front left slide
      if (determineAngleQuadrant(lookDirAngle) === 2) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle - Math.PI / 2,
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
          playerControls.moveZ(-slidingVel);
        }
      }
    }

    // moving backward
    if (this.velocity.z < -MIN_VELOCITY) {
      // back right slide
      if (determineAngleQuadrant(lookDirAngle) === 4) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle - Math.PI / 2,
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
          playerControls.moveZ(-slidingVel);
        }
      }

      // back left slide
      if (determineAngleQuadrant(lookDirAngle) === 3) {
        newVelocity.z = 0;

        const slidingVel = this.calculateSlidingVelocity(
          lookDirAngle + Math.PI / 2,
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
          playerControls.moveZ(slidingVel);
        }
      }
    }

    // right side walking
    if (this.velocity.x > MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(lookDirAngle) === 3) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(-slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(lookDirAngle) === 2) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(slidingVel);
        }
      }
    }

    // left side walking
    if (this.velocity.x < -MIN_VELOCITY) {
      // move forward
      if (determineAngleQuadrant(lookDirAngle) === 4) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(slidingVel);
        }
      }

      // move backward
      if (determineAngleQuadrant(lookDirAngle) === 1) {
        newVelocity.x = 0;

        const slidingVel = this.calculateSlidingVelocity(lookDirAngle, dt);

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
          playerControls.moveZ(-slidingVel);
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
    const { width, height } = this;
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
    const { width, height } = this;
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

  private calculateSlidingVelocity(lookDirAngle: number, dt: number) {
    const { horizontalSpeed } = this.properties;
    // even when the angle is near 90 degree or Math.PI
    // we still keep the player freezed against the wall
    if (
      Math.abs(lookDirAngle - Math.PI / 2) <= SLIDING_DEAD_ANGLE ||
      Math.abs(lookDirAngle + Math.PI / 2) <= SLIDING_DEAD_ANGLE
    ) {
      return 0;
    }

    // NOTE a bit too much magic here (should be refactored)
    const directionFactor = Math.abs(Math.cos(lookDirAngle));
    return horizontalSpeed * directionFactor * dt * 8;
  }

  private getForwardMovementDirection() {
    return (
      (this.playerController.isMovingForward() ? 1 : 0) +
      (this.playerController.isMovingBackward() ? -1 : 0)
    );
  }

  private getRightMovementDirection() {
    return (
      (this.playerController.isMovingRight() ? 1 : 0) +
      (this.playerController.isMovingLeft() ? -1 : 0)
    );
  }

  private getFlyUpMovementDirection() {
    return (
      (this.playerController.isFlyingUp() ? 1 : 0) +
      (this.playerController.isFlyingDown() ? -1 : 0)
    );
  }

  getPlayerProperties() {
    return this.mode === "sim" ? simProps : flyProps;
  }

  getVelocity() {
    return this.velocity.clone();
  }

  getMode() {
    return this.mode;
  }

  private get position() {
    return this.playerControls.position;
  }

  private get width() {
    return Player.WIDTH;
  }

  private get height() {
    return Player.HEIGHT;
  }
}
