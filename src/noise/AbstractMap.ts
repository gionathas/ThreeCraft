import alea from "alea";

type PRNG = ReturnType<typeof alea>;

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
