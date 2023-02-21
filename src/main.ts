import * as THREE from "three";
import { AmbientLight } from "three";
import AnimatedApp from "./core/AnimatedApp";
import GameManager from "./core/GameManager";

const light1 = new THREE.DirectionalLight(0xffffff, 0.2);
light1.position.set(-1, 2, 4);

const ambientLight = new AmbientLight(0xffffff, 0.8);

const app = new AnimatedApp({
  sceneConfig: {
    background: new THREE.Color("#87CEEB"),
  },
  lightsConfig: {
    lights: [light1, ambientLight],
  },

  guiConfig: {
    grid: false,
    axes: false,
  },
});

const game = new GameManager(app, true);
game.initGame();

app.render((dt) => {
  game.update(dt);
});
