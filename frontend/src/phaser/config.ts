import Phaser from "phaser";
import BattleScene from "./scenes/BattleScene";
import { BATTLE_HEIGHT, BATTLE_WIDTH } from "./systems/battleLayout";

export function createGameConfig(parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
    return {
        type: Phaser.AUTO,
        width: BATTLE_WIDTH,
        height: BATTLE_HEIGHT,
        parent,
        backgroundColor: "#000000",
        scene: [BattleScene],
        scale: {
            mode: Phaser.Scale.NONE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
    };
}