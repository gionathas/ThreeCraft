import EnvVars from "./config/EnvVars";
import GameManager from "./core/GameManager";
import MainMenu from "./ui/MainMenu";

const game = new GameManager();

if (EnvVars.JUMP_START) {
  game.loadGame();
} else {
  const mainMenu = new MainMenu(game);
  mainMenu.show();
}
