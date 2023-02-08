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
      window.addEventListener("pointerdown", this.onPointerDownRef);
      window.addEventListener("pointerup", this.onPointerUpRef);
      window.addEventListener("keydown", this.onKeyDownRef);
      window.addEventListener("keyup", this.onKeyUpRef);
      window.addEventListener("pointermove", this.onPointerMoveRef);
    }
  }

  disable() {
    if (this.enabled) {
      this.enabled = false;
      window.removeEventListener("pointerdown", this.onPointerDownRef);
      window.removeEventListener("pointerup", this.onPointerUpRef);
      window.removeEventListener("keydown", this.onKeyDownRef);
      window.removeEventListener("keyup", this.onKeyUpRef);
      window.removeEventListener("pointermove", this.onPointerMoveRef);
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getKey(key: KeyCode) {
    return this.keys[key];
  }

  getPrevKey(key: KeyCode) {
    return this.prevKeys[key];
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
