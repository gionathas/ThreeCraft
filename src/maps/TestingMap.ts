import EnvVars from "../config/EnvVars";

export default class TestingMap {
  static readonly ENABLED = EnvVars.TESTING_MAP_ENABLED;
  static readonly CONTINENTALNESS = EnvVars.TESTING_MAP_CONTINENTALNESS;
  static readonly EROSION = EnvVars.TESTING_MAP_EROSION;
  static readonly PV = EnvVars.TESTING_MAP_PV;
}
