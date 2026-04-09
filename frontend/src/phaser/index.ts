import Phaser from "phaser";
import { createGameConfig } from "./config";

let game: Phaser.Game | null = null;

export function createPhaserGame(parent: string | HTMLElement) {
    if (game) return game;
    game = new Phaser.Game(createGameConfig(parent));
    return game;
}

export function destroyPhaserGame() {
    if (!game) return;
    game.destroy(true);
    game = null;
}