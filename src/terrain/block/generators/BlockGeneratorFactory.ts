import { TerrainMap } from "../../../maps/terrain";
import { TreeMap } from "../../../maps/tree";
import BlockGenerator from "./BlockGenerator";
import FeaturesGenerator from "./FeaturesGenerator";
import TerrainGenerator from "./TerrainGenerator";

export enum Phase {
  TERRAIN,
  FEATURES,
}

export default class BlockGeneratorFactory {
  // generators
  private terrainGenerator: TerrainGenerator;
  private featuresGenerator: FeaturesGenerator;

  constructor(terrainShapeMap: TerrainMap, treeMap: TreeMap) {
    this.terrainGenerator = new TerrainGenerator(terrainShapeMap);
    this.featuresGenerator = new FeaturesGenerator(terrainShapeMap, treeMap);
  }

  getBlockGenerator(phase: Phase): BlockGenerator {
    switch (phase) {
      case Phase.TERRAIN:
        return this.terrainGenerator;
      case Phase.FEATURES:
        return this.featuresGenerator;
    }
  }
}
