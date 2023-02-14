import { NoiseMap } from "./NoiseMap";

export default class PVMap extends NoiseMap {
  constructor(seed: string) {
    super(seed);
  }

  getPV(x: number, z: number) {
    const cachedValue = this.getCacheValue(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const octaves = 4;
    const persistence = 0.5;
    const scale = 200;

    let pv = 0;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      const frequency = Math.pow(2, i);
      const amplitude = Math.pow(persistence, i);
      maxAmplitude += amplitude;
      pv +=
        this.noise((x / scale) * frequency, (z / scale) * frequency) *
        amplitude;
    }

    pv /= maxAmplitude;

    // const pv = this.noise(x / 128, z / 128);

    this.setCacheValue(x, z, pv);
    return pv;
  }
}
