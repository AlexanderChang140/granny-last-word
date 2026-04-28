import { useState } from 'react';
import PhaserBattle from '../../components/PhaserBattle';
import type { BattleViewState, LetterTileData } from '../types';
import useGameState from '../hooks/useGameState';
import { socket } from '../../socket';

// Temporary frontend-only battle state for UI testing.
// Final battle state should come from backend/socket events.

function sortByOrder(a: LetterTileData, b: LetterTileData) {
    return a.order - b.order;
}

export default function GamePage() {
    const [connected] = useState(true);
    const [lastSubmittedWord] = useState('');
    const [hasDiscardedThisTurn, setHasDiscardedThisTurn] = useState(false);

    const { gameState, tiles, setTiles } = useGameState();


    const hasBattleStarted = gameState != null;
    const isPlayerTurn =
        hasBattleStarted &&
        gameState.turn_owner === 'player' &&
        gameState.status === 'running';

    const wordTiles = tiles
        .filter((tile) => tile.zone === 'word')
        .sort(sortByOrder);

    const discardTiles = tiles
        .filter((tile) => tile.zone === 'discard')
        .sort(sortByOrder);

    function rebuildTiles(
        hand: LetterTileData[],
        wordTilesNext: LetterTileData[],
        discard: LetterTileData[],
    ) {
        const handNormalized = hand.map((tile, index) => ({
            ...tile,
            zone: 'hand' as const,
            order: index,
        }));

        const wordNormalized = wordTilesNext.map((tile, index) => ({
            ...tile,
            zone: 'word' as const,
            order: index,
        }));

        const discardNormalized = discard.map((tile, index) => ({
            ...tile,
            zone: 'discard' as const,
            order: index,
        }));

        return [...handNormalized, ...wordNormalized, ...discardNormalized];
    }

    function moveTile(
        tileId: number,
        targetZone: 'hand' | 'word' | 'discard',
        insertIndex?: number,
    ) {
        if (!isPlayerTurn) return;

        setTiles((prev) => {
            const movingTile = prev.find((tile) => tile.id === tileId);
            if (!movingTile) return prev;

            const remaining = prev
                .filter((tile) => tile.id !== tileId)
                .map((tile) => ({ ...tile }));

            const hand = remaining
                .filter((tile) => tile.zone === 'hand')
                .sort(sortByOrder);
            const wordTilesNext = remaining
                .filter((tile) => tile.zone === 'word')
                .sort(sortByOrder);
            const discard = remaining
                .filter((tile) => tile.zone === 'discard')
                .sort(sortByOrder);

            const moved = { ...movingTile, zone: targetZone, order: 0 };

            if (targetZone === 'hand') {
                hand.push(moved);
            } else if (targetZone === 'discard') {
                discard.push(moved);
            } else {
                const safeIndex = Math.max(
                    0,
                    Math.min(
                        insertIndex ?? wordTilesNext.length,
                        wordTilesNext.length,
                    ),
                );
                wordTilesNext.splice(safeIndex, 0, moved);
            }

            return rebuildTiles(hand, wordTilesNext, discard);
        });
    }

    function handleStartBattle() {
        socket.emit('start_battle');
    }

    function moveTileToWord(tileId: number, insertIndex?: number) {
        moveTile(tileId, 'word', insertIndex);
    }

    function moveTileToDiscard(tileId: number) {
        moveTile(tileId, 'discard');
    }

    function moveTileToHand(tileId: number) {
        moveTile(tileId, 'hand');
    }

    function handleLetterKeyPressed(letter: string) {
        if (!isPlayerTurn) return;

        setTiles((prev) => {
            const hand = prev
                .filter((tile) => tile.zone === 'hand')
                .sort(sortByOrder);

            const target = hand.find(
                (tile) => tile.letter.toUpperCase() === letter.toUpperCase(),
            );
            if (!target) return prev;

            const remaining = prev
                .filter((tile) => tile.id !== target.id)
                .map((tile) => ({ ...tile }));

            const nextHand = remaining
                .filter((tile) => tile.zone === 'hand')
                .sort(sortByOrder);
            const nextWord = remaining
                .filter((tile) => tile.zone === 'word')
                .sort(sortByOrder);
            const nextDiscard = remaining
                .filter((tile) => tile.zone === 'discard')
                .sort(sortByOrder);

            nextWord.push({ ...target, zone: 'word', order: 0 });

            return rebuildTiles(nextHand, nextWord, nextDiscard);
        });
    }

    function handleBackspace() {
        if (!isPlayerTurn || wordTiles.length === 0) return;
        const lastTile = wordTiles[wordTiles.length - 1];
        moveTile(lastTile.id, 'hand');
    }

    function handleClear() {
        if (!hasBattleStarted) return;

        setTiles((prev) => {
            const hand = prev
                .filter((tile) => tile.zone === 'hand')
                .sort(sortByOrder);

            const wordTilesNext = prev
                .filter((tile) => tile.zone === 'word')
                .sort(sortByOrder);

            const discardTilesNext = prev
                .filter((tile) => tile.zone === 'discard')
                .sort(sortByOrder);

            return rebuildTiles(
                [...hand, ...wordTilesNext, ...discardTilesNext],
                [],
                [],
            );
        });
    }

    function handleEndTurn() {
        if (!hasBattleStarted) return;
        setHasDiscardedThisTurn(false);
        socket.emit('end_turn');
    }

    function handleSubmit() {
        if (!hasBattleStarted) return;
        socket.emit(
            'submit_word',
            tiles.filter((l) => l.zone === 'word').map((l) => l.id),
        );
    }

    function handleDiscard() {
        if (!isPlayerTurn || hasDiscardedThisTurn) return;

        setTiles((prev) => {
            const hand = prev
                .filter((tile) => tile.zone === 'hand')
                .sort(sortByOrder);

            const wordTilesNext = prev
                .filter((tile) => tile.zone === 'word')
                .sort(sortByOrder);

            const discard = prev
                .filter((tile) => tile.zone === 'discard')
                .sort(sortByOrder);

            if (discard.length === 0) return prev;

            socket.emit(
                'discard_letters',
                discard.map((t) => t.id),
            );

            return rebuildTiles([...hand], wordTilesNext, []);
        });

        setHasDiscardedThisTurn(true);
    }

    const phaserState: BattleViewState = {
        connected,
        battleStarted: hasBattleStarted,
        gameState,
        lastSubmittedWord,
        tiles,
    };

    return (
        <div className="game-page">
            <div className="battle-layout">
                {!hasBattleStarted && (
                    <div className="start-overlay">
                        <div className="start-overlay-card">
                            <h1>Granny&apos;s Last Word</h1>
                            <p>Enter the battle and build words to attack.</p>
                            <button
                                className="battle-button start big"
                                onClick={handleStartBattle}
                            >
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
                        disabled={
                            !isPlayerTurn ||
                            discardTiles.length === 0 ||
                            hasDiscardedThisTurn
                        }
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
