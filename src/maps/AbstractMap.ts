import alea from "alea";

type PRNG = ReturnType<typeof alea>;

export type MapData = Map<string, number>;

export interface Map2D {
  getValueAt(x: number, z: number): number;
  setValueAt(x: number, z: number, value: number): number;
}

export interface Map3D {
  getValueAt(x: number, y: number, z: number): number;
  setValueAt(x: number, y: number, z: number, value: number): number;
}

export default abstract class AbstractMap {
  protected seed: string;
  protected prng: PRNG;

  constructor(seed: string) {
    this.seed = seed;
    this.prng = alea(seed);
  }

  getSeed() {
    return this.seed;
  }
}
