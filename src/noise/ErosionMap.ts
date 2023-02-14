import { NoiseMap } from "./NoiseMap";

export default class ErosionMap extends NoiseMap {
  constructor(seed: string) {
    super(seed);
  }

  getErosion(x: number, z: number) {
    const cachedValue = this.getCacheValue(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const erosion = this.noise(x / 512, z / 512);

    // const octaves = 1;
    // const persistence = 0.5;
    // const scale = 2048;

    // let erosion = 0;
    // let maxAmplitude = 0;

    // for (let i = 0; i < octaves; i++) {
    //   const frequency = Math.pow(2, i);
    //   const amplitude = Math.pow(persistence, i);
    //   maxAmplitude += amplitude;
    //   erosion +=
    //     this.noise((x / scale) * frequency, (z / scale) * frequency) *
    //     amplitude;
    // }

    // erosion /= maxAmplitude;

    this.setCacheValue(x, z, erosion);
    return erosion;
  }
}
