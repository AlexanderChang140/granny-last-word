import { useState } from "react";
import PhaserBattle from "../components/PhaserBattle";
import type { GameState } from "../game/GameManager";
import type { BattleViewState, LetterTileData } from "../phaser/gameTypes";

// Temporary frontend-only battle state for UI testing.
// Final battle state should come from backend/socket events.

const initialState: GameState = {
    player_hp: 100,
    enemy_hp: 100,
    turn_owner: "player",
    status: "running",
};

const initialHand = ["A", "R", "E", "T", "L", "O", "N", "S", "D", "I"];

function buildInitialTiles(): LetterTileData[] {
    return initialHand.map((letter, index) => ({
        id: `${letter}-${index}`,
        letter,
        zone: "hand",
        order: index,
    }));
}

function sortByOrder(a: LetterTileData, b: LetterTileData) {
    return a.order - b.order;
}

export default function GamePage() {
    const [gameState] = useState<GameState>(initialState);
    const [connected] = useState(true);
    const [lastSubmittedWord] = useState("");
    const [battleStarted, setBattleStarted] = useState(false);
    const [tiles, setTiles] = useState<LetterTileData[]>(buildInitialTiles());

    const isPlayerTurn =
        battleStarted &&
        gameState.turn_owner === "player" &&
        gameState.status === "running";

    const wordTiles = tiles
        .filter((tile) => tile.zone === "word")
        .sort(sortByOrder);

    const discardTiles = tiles
        .filter((tile) => tile.zone === "discard")
        .sort(sortByOrder);

    const [hasDiscardedThisTurn, setHasDiscardedThisTurn] = useState(false);

    function rebuildTiles(
        hand: LetterTileData[],
        wordTilesNext: LetterTileData[],
        discard: LetterTileData[],
    ) {
        const handNormalized = hand.map((tile, index) => ({
            ...tile,
            zone: "hand" as const,
            order: index,
        }));

        const wordNormalized = wordTilesNext.map((tile, index) => ({
            ...tile,
            zone: "word" as const,
            order: index,
        }));

        const discardNormalized = discard.map((tile, index) => ({
            ...tile,
            zone: "discard" as const,
            order: index,
        }));

        return [...handNormalized, ...wordNormalized, ...discardNormalized];
    }

    function moveTile(tileId: string, targetZone: "hand" | "word" | "discard", insertIndex?: number) {
        if (!isPlayerTurn) return;

        setTiles((prev) => {
            const movingTile = prev.find((tile) => tile.id === tileId);
            if (!movingTile) return prev;

            const remaining = prev
                .filter((tile) => tile.id !== tileId)
                .map((tile) => ({ ...tile }));

            const hand = remaining.filter((tile) => tile.zone === "hand").sort(sortByOrder);
            const wordTilesNext = remaining.filter((tile) => tile.zone === "word").sort(sortByOrder);
            const discard = remaining.filter((tile) => tile.zone === "discard").sort(sortByOrder);

            const moved = { ...movingTile, zone: targetZone, order: 0 };

            if (targetZone === "hand") {
                hand.push(moved);
            } else if (targetZone === "discard") {
                discard.push(moved);
            } else {
                const safeIndex = Math.max(
                    0,
                    Math.min(insertIndex ?? wordTilesNext.length, wordTilesNext.length),
                );
                wordTilesNext.splice(safeIndex, 0, moved);
            }

            return rebuildTiles(hand, wordTilesNext, discard);
        });
    }

    function handleStartBattle() {
        setBattleStarted(true);
    }

    function moveTileToWord(tileId: string, insertIndex?: number) {
        moveTile(tileId, "word", insertIndex);
    }

    function moveTileToDiscard(tileId: string) {
        moveTile(tileId, "discard");
    }

    function moveTileToHand(tileId: string) {
        moveTile(tileId, "hand");
    }

    function handleLetterKeyPressed(letter: string) {
        if (!isPlayerTurn) return;

        setTiles((prev) => {
            const hand = prev
                .filter((tile) => tile.zone === "hand")
                .sort(sortByOrder);

            const target = hand.find((tile) => tile.letter.toUpperCase() === letter.toUpperCase());
            if (!target) return prev;

            const remaining = prev
                .filter((tile) => tile.id !== target.id)
                .map((tile) => ({ ...tile }));

            const nextHand = remaining.filter((tile) => tile.zone === "hand").sort(sortByOrder);
            const nextWord = remaining.filter((tile) => tile.zone === "word").sort(sortByOrder);
            const nextDiscard = remaining.filter((tile) => tile.zone === "discard").sort(sortByOrder);

            nextWord.push({ ...target, zone: "word", order: 0 });

            return rebuildTiles(nextHand, nextWord, nextDiscard);
        });
    }

    function handleBackspace() {
        if (!isPlayerTurn || wordTiles.length === 0) return;
        const lastTile = wordTiles[wordTiles.length - 1];
        moveTile(lastTile.id, "hand");
    }

function handleClear() {
    if (!battleStarted) return;

    setTiles((prev) => {
        const hand = prev
            .filter((tile) => tile.zone === "hand")
            .sort(sortByOrder);

        const wordTilesNext = prev
            .filter((tile) => tile.zone === "word")
            .sort(sortByOrder);

        const discardTilesNext = prev
            .filter((tile) => tile.zone === "discard")
            .sort(sortByOrder);

        return rebuildTiles([...hand, ...wordTilesNext, ...discardTilesNext], [], []);
    });
}

function handleEndTurn() {
    if (!battleStarted) return;
    setHasDiscardedThisTurn(false);

    setTiles((prev) => {
        const hand = prev
            .filter((tile) => tile.zone === "hand")
            .sort(sortByOrder);

        const wordTilesNext = prev
            .filter((tile) => tile.zone === "word")
            .sort(sortByOrder);

        const discardTilesNext = prev
            .filter((tile) => tile.zone === "discard")
            .sort(sortByOrder);

        return rebuildTiles([...hand, ...wordTilesNext, ...discardTilesNext], [], []);
    });
}

function handleSubmit() {
    if (!battleStarted) return;

    setTiles((prev) => {
        const hand = prev
            .filter((tile) => tile.zone === "hand")
            .sort(sortByOrder);

        const wordTilesNext = prev
            .filter((tile) => tile.zone === "word")
            .sort(sortByOrder);

        const discardTilesNext = prev
            .filter((tile) => tile.zone === "discard")
            .sort(sortByOrder);

        if (wordTilesNext.length === 0) {
            return rebuildTiles([...hand, ...discardTilesNext], [], []);
        }

        const refillPool = ["M", "G", "U", "P", "H", "B", "Y", "C", "F", "K", "E", "A"];
        const refillCount = wordTilesNext.length;

        const refills: LetterTileData[] = refillPool
            .slice(0, refillCount)
            .map((letter, index) => ({
                id: `submit-refill-${letter}-${Date.now()}-${index}`,
                letter,
                zone: "hand",
                order: hand.length + discardTilesNext.length + index,
            }));

        return rebuildTiles([...hand, ...discardTilesNext, ...refills], [], []);
    });
}

function handleDiscard() {
    if (!isPlayerTurn || hasDiscardedThisTurn) return;

    setTiles((prev) => {
        const hand = prev
            .filter((tile) => tile.zone === "hand")
            .sort(sortByOrder);

        const wordTilesNext = prev
            .filter((tile) => tile.zone === "word")
            .sort(sortByOrder);

        const discard = prev
            .filter((tile) => tile.zone === "discard")
            .sort(sortByOrder);

        if (discard.length === 0) return prev;

        const refillPool = ["M", "G", "U", "P", "H", "B", "Y", "C", "F", "K", "E", "A"];
        const refillCount = discard.length;

        const refills: LetterTileData[] = refillPool
            .slice(0, refillCount)
            .map((letter, index) => ({
                id: `discard-refill-${letter}-${Date.now()}-${index}`,
                letter,
                zone: "hand",
                order: hand.length + index,
            }));

        return rebuildTiles([...hand, ...refills], wordTilesNext, []);
    });

    setHasDiscardedThisTurn(true);
}

    const phaserState: BattleViewState = {
        connected,
        battleStarted,
        gameState,
        lastSubmittedWord,
        tiles,
    };

    return (
        <div className="game-page">
            <div className="battle-layout">
                {!battleStarted && (
                    <div className="start-overlay">
                        <div className="start-overlay-card">
                            <h1>Granny&apos;s Last Word</h1>
                            <p>Enter the battle and build words to attack.</p>
                            <button className="battle-button start big" onClick={handleStartBattle}>
                                Start Battle
                            </button>
                        </div>
                    </div>
                )}

                <PhaserBattle
                    state={phaserState}
                    onTileToWord={moveTileToWord}
                    onTileToDiscard={moveTileToDiscard}
                    onTileToHand={moveTileToHand}
                    onLetterKeyPressed={handleLetterKeyPressed}
                    onSubmitPressed={handleSubmit}
                    onBackspacePressed={handleBackspace}
                    onClearPressed={handleClear}
                    onEndTurnPressed={handleEndTurn}
                />

                <div className="battle-overlay-buttons left">
                    <button
                        className="battle-button side-button"
                        onClick={handleDiscard}
                        disabled={!isPlayerTurn || discardTiles.length === 0 || hasDiscardedThisTurn}
                    >
                        Discard
                    </button>
                </div>

                <div className="battle-overlay-buttons right">
                    <button
                        className="battle-button side-button"
                        onClick={handleBackspace}
                        disabled={!isPlayerTurn || wordTiles.length === 0}
                    >
                        Backspace
                    </button>

                    <button
                        className="battle-button side-button"
                        onClick={handleClear}
                        disabled={!isPlayerTurn || wordTiles.length === 0}
                    >
                        Clear
                    </button>

                    <button
                        className="battle-button primary side-button"
                        onClick={handleSubmit}
                        disabled={!isPlayerTurn || wordTiles.length === 0}
                    >
                        Submit
                    </button>

                    <button
                        className="battle-button side-button"
                        onClick={handleEndTurn}
                        disabled={!isPlayerTurn}
                    >
                        End Turn
                    </button>
                </div>
            </div>
        </div>
    );
}