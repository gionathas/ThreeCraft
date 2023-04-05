import { Vector3 } from "three";
import StepSoundEffect from "../audio/StepSoundEffect";
import EnvVars from "../config/EnvVars";
import Terrain from "../entities/Terrain";
import { Block } from "../terrain/block";
import { determineAngleQuadrant } from "../utils/helpers";
import Physics from "../utils/Physics";
import PlayerConstants from "./PlayerConstants";
import PlayerController from "./PlayerController";
import PlayerControls from "./PlayerControls";

export type PhysicsMode = "sim" | "fly";
export type GroundState =
  | "falling"
  | "jumping"
  | "still"
  | "walking"
  | "running";

const speedMultipliers: Record<GroundState, number> = {
  falling: 0.8,
  jumping: 0.8,
  walking: 1,
  running: 1.8,
  still: 1,
};

/**
 *
 * //TODO detect collision in the mid area of the player hit box, currenyly a collision
 * is detected only when one of his bounding box apex hit a block
 *
 * //TODO sliding response need to be improved, the ideal would be using vector projection onto a plane
 *
 * //TODO extract some classes like one for managing collision detection
 */
export default class PlayerPhysics {
  private static readonly BASE_DAMPING_FACTOR = 10;
  private static readonly SLIDING_FACTOR = 7;
  private static readonly SLIDING_DEAD_ANGLE = 0.1;

  private terrain: Terrain;
  private playerControls: PlayerControls;
  private playerController: PlayerController;

  // sounds
  private stepSoundEffect: StepSoundEffect;

  // state
  private mode: PhysicsMode;
  private groundState: GroundState;
  private prevGroundState: GroundState;

  private velocity: THREE.Vector3;
  private moveDirection: THREE.Vector3;
  private dampingFactor: number;

  constructor(
    playerController: PlayerController,
    playerControls: PlayerControls,
    terrain: Terrain
  ) {
    this.playerController = playerController;
    this.playerControls = playerControls;
    this.terrain = terrain;
    this.stepSoundEffect = new StepSoundEffect();

    this.mode = EnvVars.PLAYER_DEFAULT_PHYSICS_MODE;
    this.prevGroundState = "falling";
    this.groundState = "falling";
    this.dampingFactor = PlayerPhysics.BASE_DAMPING_FACTOR;

    this.moveDirection = new Vector3();
    this.velocity = new Vector3();
  }

  update(dt: number) {
    const { playerControls } = this;

    this.updatePhysicsMode();
    this.updateGroundState();

    this.updateHorizontalVelocity(dt);
    this.updateVerticalVelocity(dt);

    this.applyHorizontalCollisionResponse(dt);
    this.applyVerticalCollisionResponse();

    // update player position
    playerControls.moveForward(this.velocity.z);
    playerControls.moveUp(this.velocity.y);
    playerControls.moveRight(this.velocity.x);

    this.applyVelocityDamping(dt);
    this.prevGroundState = this.groundState;
  }

  private updatePhysicsMode() {
    const currentMode = this.mode;

    if (this.playerController.hasSwitchedPhysicsMode()) {
      this.mode = currentMode === "sim" ? "fly" : "sim";
    }
  }

  private updateGroundState() {
    const groundBlock = this.isHittingGround();
    const isOnGround = groundBlock !== null;

    if (!isOnGround) {
      this.groundState = this.velocity.y <= 0 ? "falling" : "jumping";
    } else {
      // player is above a solid block
      const hasJumped = this.playerController.hasJumped();
      const isStill = this.isStill();

      if (hasJumped) {
        this.groundState = "jumping";
      } else if (isStill) {
        this.groundState = "still";
      } else {
        const isRunning = this.playerController.isRunning();
        this.groundState = isRunning ? "running" : "walking";

        // play step sounds over the ground block
        this.stepSoundEffect.playStepSound(groundBlock, isRunning);
      }
    }
  }

  private updateHorizontalVelocity(dt: number) {
    const { horizontalSpeed } = this;

    this.moveDirection.x = this.getRightMovementDirection();
    this.moveDirection.z = this.getForwardMovementDirection();

    this.velocity.x += this.moveDirection.x * horizontalSpeed * dt;
    this.velocity.z += this.moveDirection.z * horizontalSpeed * dt;
  }

  private updateVerticalVelocity(dt: number) {
    const { mode: controlsMode } = this;

    switch (controlsMode) {
      case "sim":
        const isJumping = this.groundState === "jumping";
        const wasJumping = this.prevGroundState === "jumping";

        // jump detection
        if (isJumping && !wasJumping) {
          this.velocity.y += PlayerConstants.JUMP_SPEED * dt;
        }
        break;
      case "fly":
        const upDirection = this.getFlyUpMovementDirection();
        this.velocity.y +=
          upDirection * PlayerConstants.FLY_VERTICAL_SPEED * dt;
        break;
    }
  }

  private applyVelocityDamping(dt: number) {
    const { isFlyMode } = this;

    this.updateDampingFactor();

    this.velocity.x -= this.velocity.x * this.dampingFactor * dt;
    this.velocity.z -= this.velocity.z * this.dampingFactor * dt;

    // if its flying, we have no forces that will slow the player down
    // so we need to set one manually
    if (isFlyMode) {
      this.velocity.y -= this.velocity.y * this.dampingFactor * dt;
    } else {
      this.applyGravity(dt);
    }
  }

  private updateDampingFactor() {
    const isJumping = this.groundState === "jumping";
    const wasRunning = this.prevGroundState === "running";

    // set a reduced damping factor when the player jumps after running
    if (isJumping && wasRunning) {
      this.dampingFactor = PlayerPhysics.BASE_DAMPING_FACTOR / 2;
    } else {
      // reset the damping factor while on ground and keep the current one
      // while in air
      if (this.onGround) {
        this.dampingFactor = PlayerPhysics.BASE_DAMPING_FACTOR;
      }
    }
  }

  private applyGravity(dt: number) {
    if (this.groundState === "falling") {
      this.velocity.y -= Physics.FALLING_GRAVITY * dt;
    }

    if (this.groundState === "jumping") {
      this.velocity.y -= Physics.JUMPING_GRAVITY * dt;
    }
  }

  private applyVerticalCollisionResponse() {
    const { playerControls, isFlyMode } = this;

    // no collision response in fly mode
    if (isFlyMode) return;

    const isTopColliding = this.isTopColliding();

    if (this.onGround) {
      // stop the player from keeping going down
      this.velocity.y = 0;

      // hit ground after falling
      if (this.prevGroundState === "falling") {
        const feetY = playerControls.getFeetHeight();

        // move slightly below the surface to keep the collision with the ground
        const groundY = Math.floor(feetY) + Block.SIZE - 0.01;
        this.position.y = PlayerControls.getEyeHeightFromGround(groundY);
      }
    }

    if (isTopColliding) {
      // stop the player from keeping going up
      this.velocity.y = 0;

      const headY = this.playerControls.getHeadHeight();
      // move the player slightly below the top block it's colliding with
      const newHeadY = Math.floor(headY) - 0.01;
      this.position.y = PlayerControls.getEyeHeightFromHead(newHeadY);
    }
  }

  /**
   * Checks if the player is colliding with a solid block below its feet
   * and returns the block if it is.
   *
   * @returns the solid block below the player's feet or null if there is no solid block
   */
  private isHittingGround() {
    const { playerControls, position, feetWidth } = this;

    const feetY = playerControls.getFeetHeight();

    // slightly offset to distinguish from left or right collisions
    const left = position.x + feetWidth / 2;
    const right = position.x - feetWidth / 2;
    const xInc = left - right;

    // slightly offset to distinguish from front or back collisions
    const front = position.z + feetWidth / 2;
    const back = position.z - feetWidth / 2;
    const zInc = front - back;

    for (let x = right; x <= left; x += xInc) {
      for (let z = back; z <= front; z += zInc) {
        const groundBlock = this.terrain.getBlock({
          x,
          y: feetY,
          z,
        });

        if (groundBlock?.isSolid) {
          return groundBlock;
        }
      }
    }

    return null;
  }

  private isTopColliding() {
    const { position, playerControls } = this;

    const headY = playerControls.getHeadHeight();

    const isBlockAboveSolid = this.terrain.isSolidBlock({
      x: position.x,
      y: headY,
      z: position.z,
    });

    return isBlockAboveSolid;
  }

  private applyHorizontalCollisionResponse(dt: number) {
    const { isFlyMode } = this;

    // no collision response in fly mode
    if (isFlyMode) return;

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
    const { playerControls, width } = this;
    const position = this.position.clone();

    const top = playerControls.getHeadHeight();
    const bottom = playerControls.getFeetHeight() + 0.1;

    // push it backward but keep the collision with the block
    const blockZ = Math.floor(position.z + width / 2);
    this.position.z = blockZ - width / 2 + 0.01;

    // moving forward
    if (this.velocity.z > Physics.MIN_VELOCITY) {
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
    if (this.velocity.z < -Physics.MIN_VELOCITY) {
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
    if (this.velocity.x > Physics.MIN_VELOCITY) {
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
    if (this.velocity.x < -Physics.MIN_VELOCITY) {
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
    const { width, playerControls } = this;
    const position = this.position.clone();

    const top = playerControls.getHeadHeight();
    const bottom = playerControls.getFeetHeight() + 0.1;

    // push it forward but keep the collision with the block
    const blockZ = Math.ceil(position.z - width / 2);
    this.position.z = blockZ + width / 2 - 0.01;

    // moving forward
    if (this.velocity.z > Physics.MIN_VELOCITY) {
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
    if (this.velocity.z < -Physics.MIN_VELOCITY) {
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
    if (this.velocity.x > Physics.MIN_VELOCITY) {
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
    else if (this.velocity.x < -Physics.MIN_VELOCITY) {
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
    const { width, playerControls } = this;
    const position = this.position.clone();

    const top = playerControls.getHeadHeight();
    const bottom = playerControls.getFeetHeight() + 0.1;

    // push it back but keep the collision with the block
    const blockX = Math.ceil(position.x - width / 2);
    this.position.x = blockX + width / 2 - 0.01;

    // moving forward
    if (this.velocity.z > Physics.MIN_VELOCITY) {
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
    if (this.velocity.z < -Physics.MIN_VELOCITY) {
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
    if (this.velocity.x > Physics.MIN_VELOCITY) {
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
    else if (this.velocity.x < -Physics.MIN_VELOCITY) {
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
    const { width, playerControls } = this;
    const position = this.position.clone();

    const top = playerControls.getHeadHeight();
    const bottom = playerControls.getFeetHeight() + 0.1;

    const blockX = Math.floor(position.x + width / 2);
    this.position.x = blockX - width / 2 + 0.01;

    // moving forward
    if (this.velocity.z > Physics.MIN_VELOCITY) {
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
    if (this.velocity.z < -Physics.MIN_VELOCITY) {
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
    if (this.velocity.x > Physics.MIN_VELOCITY) {
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
    if (this.velocity.x < -Physics.MIN_VELOCITY) {
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
    const { width, playerControls } = this;
    const position = this.position.clone();

    // slightly offset to distinguish from left or right collisions
    const left = position.x + width / 2 - 0.1;
    const right = position.x - width / 2 + 0.1;
    const xInc = left - right;

    // add an offset to avoid fake horizontal collision with the ground
    const top = playerControls.getHeadHeight() - 0.1;
    const bottom = playerControls.getFeetHeight() + 0.1;
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
    const { width, playerControls } = this;
    const position = this.position.clone();

    // slightly offset to distinguish from front or back collisions
    const front = position.z + width / 2 - 0.1;
    const back = position.z - width / 2 + 0.1;
    const zInc = front - back;

    // add an offset to avoid fake horizontal collision with the ground
    const top = playerControls.getHeadHeight() - 0.1;
    const bottom = playerControls.getFeetHeight() + 0.1;
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
    const hSpeed = PlayerConstants.HORIZONTAL_SPEED;
    const slidingFactor = PlayerPhysics.SLIDING_FACTOR;
    const slidingDeadAngle = PlayerPhysics.SLIDING_DEAD_ANGLE;

    // if the player is directly facing the wall, don't slide
    if (
      Math.abs(lookDirAngle - Math.PI / 2) <= slidingDeadAngle ||
      Math.abs(lookDirAngle + Math.PI / 2) <= slidingDeadAngle
    ) {
      return 0;
    }

    // NOTE a bit too much magic here (should be refactored)
    const directionFactor = Math.abs(Math.cos(lookDirAngle));
    return hSpeed * directionFactor * slidingFactor * dt;
  }

  private isStill() {
    return this.velocity.length() < Physics.MIN_VELOCITY;
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

  getGroundState() {
    return this.groundState;
  }

  getVelocity() {
    return this.velocity.clone();
  }

  private get position() {
    return this.playerControls.position;
  }

  private get horizontalSpeed() {
    if (this.isFlyMode) {
      return PlayerConstants.FLY_HORIZONTAL_SPEED;
    }

    const speedFactor = speedMultipliers[this.groundState];
    return PlayerConstants.HORIZONTAL_SPEED * speedFactor;
  }

  private get onGround() {
    if (this.isFlyMode) {
      return false;
    }

    return this.groundState === "walking" || this.groundState === "running";
  }

  private get isFlyMode() {
    return this.mode === "fly";
  }

  private get feetWidth() {
    return PlayerConstants.FEET_WIDTH;
  }

  private get width() {
    return PlayerConstants.WIDTH;
  }
}
