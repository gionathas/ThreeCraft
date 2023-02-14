import { NoiseMap } from "./NoiseMap";

/**
 * This class is used for generating the height map for the terrain
 */
export default class ContinentalMap extends NoiseMap {
  constructor(seed: string) {
    super(seed);
  }

  getContinentalness(x: number, z: number) {
    const cachedValue = this.getCacheValue(x, z);

    if (cachedValue != null) {
      return cachedValue;
    }

    const continentalness = this.noise(x / 5000, z / 5000);

    // const octaves = 1;
    // const persistence = 0.5;
    // const scale = 1024;

    // let continentalness = 0;
    // let maxAmplitude = 0;

    // for (let i = 0; i < octaves; i++) {
    //   const frequency = Math.pow(2, i);
    //   const amplitude = Math.pow(persistence, i);
    //   maxAmplitude += amplitude;
    //   continentalness +=
    //     this.noise((x / scale) * frequency, (z / scale) * frequency) *
    //     amplitude;
    // }

    // continentalness /= maxAmplitude;

    this.setCacheValue(x, z, continentalness);
    return continentalness;
  }
}
