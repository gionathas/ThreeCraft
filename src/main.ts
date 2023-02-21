import Engine from "./core/Engine";
import GameManager from "./core/GameManager";

const engine = Engine.getInstance();

const game = new GameManager(engine);
game.initGame();

engine.render((dt) => {
  game.update(dt);
});
