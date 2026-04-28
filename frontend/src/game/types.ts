import type { GameState } from '../../../shared/types';

export type TileZone = 'hand' | 'word' | 'discard';

export type LetterTileData = {
    id: number;
    letter: string;
    zone: TileZone;
    order: number;
};

export type BattleViewState = {
    connected: boolean;
    battleStarted: boolean;
    gameState: GameState | undefined;
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
    stateChanged: (state: BattleViewState) => void;

    tileToWord: (payload: {
        tileId: number;
        insertIndex?: number | undefined;
    }) => void;
    tileToDiscard: (payload: { tileId: number }) => void;
    tileToHand: (payload: { tileId: number }) => void;
    letterKeyPressed: (payload: { letter: string }) => void;

    submitPressed: () => void;
    backspacePressed: () => void;
    clearPressed: () => void;
    endTurnPressed: () => void;
};
