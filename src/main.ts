import "./styles.css";
import { GameApp } from "./game/GameApp";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app");

const game = new GameApp(app);
game.start();
