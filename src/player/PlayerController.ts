import KeyBindings from "../config/KeyBindings";
import InputController from "../io/InputController";

export default class PlayerController {
  private inputController: InputController;

  constructor() {
    this.inputController = InputController.getInstance();
  }

  hasJumped() {
    return this.inputController.hasJustPressedKey(KeyBindings.JUMP_KEY);
  }

  hasSwitchedControls() {
    return this.inputController.hasJustPressedKey(
      KeyBindings.SWITCH_PLAYER_CONTROLS_MODE
    );
  }

  isMovingForward() {
    return this.inputController.isPressingKey(KeyBindings.MOVE_FORWARD_KEY);
  }

  isMovingBackward() {
    return this.inputController.isPressingKey(KeyBindings.MOVE_BACK_KEY);
  }

  isMovingRight() {
    return this.inputController.isPressingKey(KeyBindings.MOVE_RIGHT_KEY);
  }

  isMovingLeft() {
    return this.inputController.isPressingKey(KeyBindings.MOVE_LEFT_KEY);
  }

  isFlyingUp() {
    return this.inputController.isPressingKey(KeyBindings.JUMP_KEY);
  }

  isFlyingDown() {
    return this.inputController.isPressingKey(KeyBindings.SPRINT_KEY);
  }

  isPlacingBlock() {
    return this.inputController.isLeftButtonJustPressed;
  }

  isErasingBlock() {
    this.inputController.isRightButtonJustPressed;
  }

  enableControls() {
    this.inputController.enable();
  }

  disableControls() {
    this.inputController.disable();
  }
}
