import GameManager from "./core/GameManager";

(async () => {
  const game = new GameManager();
  await game.loadGame();
})();
