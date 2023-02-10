import { ChunkID } from "../terrain/Chunk";
import { Coordinate } from "./helpers";

export default class ChunkUtils {
  static coordinateAsChunkId({ x, y, z }: Coordinate): ChunkID {
    return `${x},${y},${z}`;
  }

  static chunkIdAsCoordinate(chunkID: ChunkID): Coordinate {
    const [x, y, z] = chunkID.split(",").map((val) => Number(val));
    return { x, y, z };
  }

  static getChunkIdNeighbour(chunkID: ChunkID, neighbour: "left" | "right") {
    const { x, y, z } = ChunkUtils.chunkIdAsCoordinate(chunkID);

    switch (neighbour) {
      case "left":
        return ChunkUtils.coordinateAsChunkId({ x: x - 1, y, z });
      case "right":
        return ChunkUtils.coordinateAsChunkId({ x: x + 1, y, z });
    }
  }

  /**
   * Return the chunkID of the chunk that is supposed to contain the specified position
   *
   * e.g. if we ask for the coordinates (35,0,0) which is located in the chunk with id (1,0,0)
   * its corresponding chunk id will be "1,0,0".
   */
  static computeChunkIdFromPosition(
    { x, y, z }: Coordinate,
    chunkWidth: number,
    chunkHeight: number
  ): ChunkID {
    const chunkX = Math.floor(x / chunkWidth);
    const chunkY = Math.floor(y / chunkHeight);
    const chunkZ = Math.floor(z / chunkWidth);

    return ChunkUtils.coordinateAsChunkId({
      x: chunkX,
      y: chunkY,
      z: chunkZ,
    });
  }

  /**
   * Compute the chunk origin position from the its chunk id
   *
   * e.g. if we ask for the chunkId (1,0,0) with a chunkWidth and chunkHeight of 32,
   * we will get back the chunkId (32,0,0)
   */
  static computeChunkOriginPosition(
    chunkID: ChunkID,
    chunkWidth: number,
    chunkHeight: number
  ): Coordinate {
    const {
      x: chunkX,
      y: chunkY,
      z: chunkZ,
    } = ChunkUtils.chunkIdAsCoordinate(chunkID);

    const offsetStartX = chunkX * chunkWidth;
    const offsetStartY = chunkY * chunkHeight;
    const offsetStartZ = chunkZ * chunkWidth;

    return { x: offsetStartX, y: offsetStartY, z: offsetStartZ };
  }
}
