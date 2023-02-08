import * as THREE from "three";
import AnimatedApp from "./core/AnimatedApp";
import GameManager from "./core/GameManager";

const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(-1, 2, 4);

const light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.set(1, -1, -2);

const app = new AnimatedApp({
  sceneConfig: {
    background: new THREE.Color("lightblue"),
  },
  lightsConfig: {
    lights: [light1, light2],
  },
  cameraConfig: {
    position: new THREE.Vector3(0, 0, -20),
  },
  // orbitControls: {
  //   target: new THREE.Vector3(chunkWidth / 2, chunkHeight / 2, chunkWidth / 2),
  // },
  guiConfig: {
    grid: true,
    axes: false,
  },
});

const game = new GameManager(app, true);
game.initGame();

app.render((dt) => {
  game.update(dt);
});
