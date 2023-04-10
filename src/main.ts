import Game from "./core/Game";
import Launcher from "./core/Launcher";

// init game
Game.init();

// create and start launcher
const launcher = new Launcher();
launcher.start();
