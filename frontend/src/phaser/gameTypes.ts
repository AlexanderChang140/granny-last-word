import type { GameState } from "../game/GameManager";

export type TileZone = "hand" | "word" | "discard";

export type LetterTileData = {
    id: string;
    letter: string;
    zone: TileZone;
    order: number;
};

export type BattleViewState = {
    connected: boolean;
    battleStarted: boolean;
    gameState: GameState;
    lastSubmittedWord: string;
    tiles: LetterTileData[];
};

export type PhaserToReactEvents = {
    tileToWord: { tileId: string; insertIndex?: number };
    tileToDiscard: { tileId: string };
    tileToHand: { tileId: string };
    letterKeyPressed: { letter: string };
    submitPressed: undefined;
    backspacePressed: undefined;
    clearPressed: undefined;
    endTurnPressed: undefined;
};

export type ReactToPhaserEvents = {
    stateChanged: BattleViewState;
};