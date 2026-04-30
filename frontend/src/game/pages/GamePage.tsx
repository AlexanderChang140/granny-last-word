import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
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
    const navigate = useNavigate();
    const location = useLocation();
    const startMode =
        location.state?.startMode === 'continue' ? 'continue' : 'new';
    const [connected, setConnected] = useState(socket.connected);
    const [lastSubmittedWord] = useState('');
    const [hasDiscardedThisTurn, setHasDiscardedThisTurn] = useState(false);
    const previousTurnRef = useRef<number | null>(null);

    const { gameState, tiles, setTiles } = useGameState(startMode);

    const hasBattleStarted = gameState != null;
    const showDefeatModal =
        gameState?.status === 'finished' && gameState.result === 'GAME_LOST';
    const showRoundWonModal =
        gameState?.status === 'finished' && gameState.result === 'ROUND_WON';
    const showGameWonModal =
        gameState?.status === 'finished' && gameState.result === 'GAME_WON';
    useEffect(() => {
        function handleConnect() {
            setConnected(true);
        }
        function handleDisconnect() {
            setConnected(false);
        }

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, []);

    useEffect(() => {
        const turnNumber = gameState?.turn_number;
        if (turnNumber == null) return;

        if (previousTurnRef.current == null) {
            previousTurnRef.current = turnNumber;
            return;
        }

        if (turnNumber !== previousTurnRef.current) {
            setHasDiscardedThisTurn(false);
            previousTurnRef.current = turnNumber;
        }
    }, [gameState?.turn_number]);

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
            const upper = letter.toUpperCase();
            const hand = prev
                .filter((tile) => tile.zone === 'hand')
                .sort(sortByOrder);
            const discard = prev
                .filter((tile) => tile.zone === 'discard')
                .sort(sortByOrder);

            const target =
                hand.find((tile) => tile.letter.toUpperCase() === upper) ??
                discard.find((tile) => tile.letter.toUpperCase() === upper);
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

    function handleStartNewGame() {
        setHasDiscardedThisTurn(false);
        socket.emit('start_battle', true);
    }

    function handleContinueStage() {
        setHasDiscardedThisTurn(false);
        socket.emit('continue_stage');
    }

    function handleReturnToMenu() {
        navigate('/menu');
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

            {showDefeatModal && (
                <div className="menu-modal-overlay" onClick={handleReturnToMenu}>
                    <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="menu-modal-title">Defeated</h2>
                        <p className="menu-modal-text">
                            Granny has fallen. What would you like to do?
                        </p>

                        <div className="menu-modal-actions two-column">
                            <button
                                className="menu-button primary"
                                onClick={handleStartNewGame}
                            >
                                Start New Game
                            </button>
                            <button
                                className="menu-button"
                                onClick={handleReturnToMenu}
                            >
                                Main Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRoundWonModal && (
                <div className="menu-modal-overlay" onClick={handleReturnToMenu}>
                    <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="menu-modal-title">Stage Cleared</h2>
                        <p className="menu-modal-text">
                            Stage {gameState?.level} complete! Continue to stage{' '}
                            {(gameState?.level ?? 1) + 1}?
                        </p>

                        <div className="menu-modal-actions two-column">
                            <button
                                className="menu-button primary"
                                onClick={handleContinueStage}
                            >
                                Continue
                            </button>
                            <button
                                className="menu-button"
                                onClick={handleReturnToMenu}
                            >
                                Main Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGameWonModal && (
                <div className="menu-modal-overlay" onClick={handleReturnToMenu}>
                    <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="menu-modal-title">Congratulations!</h2>
                        <p className="menu-modal-text">
                            You cleared all 5 stages. Final run score:{' '}
                            {gameState?.run_score ?? 0}
                        </p>

                        <div className="menu-modal-actions two-column">
                            <button
                                className="menu-button primary"
                                onClick={handleStartNewGame}
                            >
                                Start New Game
                            </button>
                            <button
                                className="menu-button"
                                onClick={handleReturnToMenu}
                            >
                                Main Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
