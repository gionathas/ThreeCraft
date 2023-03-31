import { Quaternion, Vector3 } from "three";
import EnvVars from "../config/EnvVars";
import InventoryManager, { InventoryState } from "./InventoryManager";

export default class PlayerConstants {
  public static readonly DEFAULT_SPAWN_POSITION = new Vector3(0, 0, 0);
  public static readonly DEFAULT_LOOK_ROTATION = new Quaternion(0, 0, 0);
  public static readonly DEFAULT_INVENTORY_STATE: InventoryState = {
    hotbar: EnvVars.STARTING_HOTBAR_ITEMS.map((item) => {
      return { block: item, amount: InventoryManager.MAX_STACK_SIZE };
    }),
    inventory: EnvVars.STARTING_INVENTORY_ITEMS.map((item) => {
      return { block: item, amount: InventoryManager.MAX_STACK_SIZE };
    }),
  };

  /** Physics */

  public static readonly WIDTH = 0.4;
  public static readonly HEIGHT = 1.8;
  public static readonly FEET_WIDTH = 0.25;

  // Fly mode
  public static readonly FLY_HORIZONTAL_SPEED = 4;
  public static readonly FLY_VERTICAL_SPEED = 3;

  // Sim Mode
  public static readonly HORIZONTAL_SPEED = 0.6;
  public static readonly JUMP_SPEED = 9.2;
}
