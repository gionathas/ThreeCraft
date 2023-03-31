import iconsImageUrl from "../assets/icons.png?url";
import { BlockRegistry, BlockType } from "../terrain/block";

export default class Icons {
  private static readonly ICON_SIZE = 32;

  private static readonly URL_PATH = iconsImageUrl;

  static getBlockIconUrlPath(block: BlockType) {
    return Icons.URL_PATH;
  }

  static getBlockIconPosition(block: BlockType) {
    const { row, col } = BlockRegistry[block].icon;

    return {
      x: col * this.ICON_SIZE,
      y: row * this.ICON_SIZE,
    };
  }
}
