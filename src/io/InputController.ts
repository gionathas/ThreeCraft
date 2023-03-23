type PointerState = {
  leftButton: boolean;
  rightButton: boolean;
  mouseX: number;
  mouseY: number;
  centeredMouseX: number;
  centeredMouseY: number;
};

type KeyCode = string;
export default class InputController {
  private static instance: InputController;
  private previousPointer: PointerState | null;
  private currentPointer: PointerState;

  private prevKeys: Record<KeyCode, boolean>;
  private keys: Record<KeyCode, boolean>;
  private enabled: boolean;

  // listeners ref
  private onKeyDownRef: (e: KeyboardEvent) => void;
  private onKeyUpRef: (e: KeyboardEvent) => void;
  private onPointerDownRef: (e: PointerEvent) => void;
  private onPointerUpRef: (e: PointerEvent) => void;
  private onPointerMoveRef: (e: PointerEvent) => void;

  private constructor() {
    this.previousPointer = null;
    this.currentPointer = {
      leftButton: false,
      rightButton: false,
      mouseX: 0,
      mouseY: 0,
      centeredMouseX: 0,
      centeredMouseY: 0,
    };
    this.prevKeys = {};
    this.keys = {};
    this.enabled = false;

    // listeners refs
    this.onKeyDownRef = this.onKeyDown.bind(this);
    this.onKeyUpRef = this.onKeyUp.bind(this);
    this.onPointerDownRef = this.onPointerDown.bind(this);
    this.onPointerUpRef = this.onPointerUp.bind(this);
    this.onPointerMoveRef = this.onPointerMove.bind(this);
  }

  public static getInstance(): InputController {
    if (!InputController.instance) {
      InputController.instance = new InputController();
    }
    return InputController.instance;
  }

  enable() {
    if (!this.enabled) {
      this.enabled = true;
      document.addEventListener("pointerdown", this.onPointerDownRef);
      document.addEventListener("pointerup", this.onPointerUpRef);
      document.addEventListener("keydown", this.onKeyDownRef);
      document.addEventListener("keyup", this.onKeyUpRef);
      document.addEventListener("pointermove", this.onPointerMoveRef);
    }
  }

  disable() {
    if (this.enabled) {
      this.enabled = false;
      document.removeEventListener("pointerdown", this.onPointerDownRef);
      document.removeEventListener("pointerup", this.onPointerUpRef);
      document.removeEventListener("keydown", this.onKeyDownRef);
      document.removeEventListener("keyup", this.onKeyUpRef);
      document.removeEventListener("pointermove", this.onPointerMoveRef);
    }
  }

  isEnabled() {
    return this.enabled;
  }

  isPressingKey(key: KeyCode) {
    return this.keys[key];
  }

  wasPressingKey(key: KeyCode) {
    return this.prevKeys[key];
  }

  hasJustPressedKey(key: KeyCode) {
    return this.isPressingKey(key) && !this.wasPressingKey(key);
  }

  get pointer() {
    const { currentPointer, previousPointer } = this;
    return {
      current: currentPointer,
      previous: previousPointer,
    };
  }

  get isLeftButtonJustPressed() {
    return (
      this.currentPointer.leftButton &&
      this.previousPointer?.leftButton === false
    );
  }

  get isRightButtonJustPressed() {
    return (
      this.currentPointer.rightButton &&
      this.previousPointer?.rightButton === false
    );
  }

  get currentPointerCenterCoordinates() {
    return [
      this.pointer.current.centeredMouseX,
      this.pointer.current.centeredMouseY,
    ];
  }

  get previousPointerCenterCoordinates() {
    return [
      this.pointer.previous?.centeredMouseX,
      this.pointer.previous?.centeredMouseY,
    ];
  }

  update() {
    this.prevKeys = { ...this.keys };
    this.previousPointer = { ...this.currentPointer };
  }

  private onPointerDown(e: PointerEvent) {
    switch (e.button) {
      case 0: {
        this.currentPointer.leftButton = true;
        break;
      }
      case 2: {
        this.currentPointer.rightButton = true;
        break;
      }
    }
  }

  private onPointerUp(e: PointerEvent) {
    switch (e.button) {
      case 0: {
        this.currentPointer.leftButton = false;
        break;
      }
      case 2: {
        this.currentPointer.rightButton = false;
        break;
      }
    }
  }

  private onPointerMove(e: PointerEvent) {
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;

    this.currentPointer.mouseX = e.pageX - halfWidth;
    this.currentPointer.mouseY = e.pageY - halfHeight;

    this.currentPointer.centeredMouseX = halfWidth;
    this.currentPointer.centeredMouseY = halfHeight;

    if (this.previousPointer === null) {
      this.previousPointer = { ...this.currentPointer };
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }
}
