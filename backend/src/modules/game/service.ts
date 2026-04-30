import type { Socket } from 'socket.io';
import { get, set, update } from './cache.js';
import { GameEngine } from './engine.js';
import { checkLetters, drawLetters, parseWord, toWord, useLetters } from './deck.js';
import { recordRunResult, recordRunStarted, recordWordProgress } from './stats.js';
import type { GameState } from '../../../../shared/types.js';

/**
 * START BATTLE:
 * Triggered when the user presses 'S' or enters a combat zone. (Can Change to 'Enter' or other key)
 * Initializes a fresh state for this specific connection.
 */
export async function startBattle(socket: Socket, forceReset: boolean = false) {
    const userId = socket.data.userData.id;

    let state = (await get(userId))?.gameState;

    if (!state || forceReset) {
        state = GameEngine.setupNewBattle();
        await set(userId, { gameState: state });
        await recordRunStarted(userId);
    }
    socket.emit('state_update', state);
}

export async function continueStage(socket: Socket) {
    const userId = socket.data.userData.id;

    await updateGameState(userId, (state) => {
        if (!state) return state;
        const nextState = GameEngine.continueToNextStage(state);
        socket.emit('state_update', nextState);
        return nextState;
    });
}

/**
 * PROCESS PLAYER ACTION:
 * Triggered when the user submits a word (Spacebar in the tester).
 */
export async function submitWord(socket: Socket, letters: number[]) {
    const sessionId = socket.data.userData.id;
    let shouldRecordEnemyKill = false;
    let completedResult: GameState['result'];
    let scoreToRecord: number | null = null;
    let longestWordCandidate: string | null = null;

    await updateGameState(sessionId, (state) => {
        if (
            !state ||
            state.turn_owner !== 'player' ||
            state.status !== 'running'
        ) {
            console.log(
                "ACTION BLOCKED - Not player's turn or battle not running",
            );
            console.log('State:', state);
            return state;
        }

        console.log('Processing Player Attack...');
        console.log('Enemy HP before attack:', state.enemy_hp);

        const submittedState = GameEngine.submitWord(state, letters);
        const wasSuccessful = submittedState.run_score > state.run_score;

        if (wasSuccessful) {
            const parsedWord = toWord(parseWord(letters, state.hand));
            scoreToRecord = submittedState.run_score;
            longestWordCandidate = parsedWord.toUpperCase();
        }

        let newState = submittedState;
        if (wasSuccessful && submittedState.status === 'running') {
            newState = GameEngine.end_turn(submittedState);
        }

        if (
            newState.status === 'finished' &&
            newState.result &&
            state.status !== 'finished'
        ) {
            completedResult = newState.result;
            shouldRecordEnemyKill =
                newState.result === 'ROUND_WON' ||
                newState.result === 'GAME_WON';
        }

        console.log('Enemy HP after attack:', newState.enemy_hp);
        socket.emit('state_update', newState);
        return newState;
    });

    if (scoreToRecord != null && longestWordCandidate) {
        await recordWordProgress(sessionId, longestWordCandidate, scoreToRecord);
    }

    if (completedResult) {
        await recordRunResult(
            sessionId,
            completedResult,
            shouldRecordEnemyKill ? 1 : 0,
        );
    }
}

export async function endTurn(socket: Socket) {
    const sessionId = socket.data.userData.id;
    let completedResult: GameState['result'];

    await updateGameState(sessionId, (state) => {
        if (
            !state ||
            state.turn_owner !== 'player' ||
            state.status !== 'running'
        ) {
            console.log(
                "ACTION BLOCKED - Not player's turn or battle not running",
            );
            console.log('State:', state);
            return state;
        }

        const newState = GameEngine.end_turn(state);
        if (
            newState.status === 'finished' &&
            newState.result &&
            state.status !== 'finished'
        ) {
            completedResult = newState.result;
        }

        socket.emit('state_update', newState);
        return newState;
    });

    if (completedResult) {
        await recordRunResult(sessionId, completedResult, 0);
    }
}

export async function discardLetters(socket: Socket, letters: number[]) {
    const sessionId = socket.data.userData.id;

    await updateGameState(sessionId, (state) => {
        if (
            !state ||
            state.turn_owner !== 'player' ||
            state.status !== 'running'
        ) {
            console.log(
                "ACTION BLOCKED - Not player's turn or battle not running",
            );
            console.log('State:', state);
            return state;
        }

        if (letters.length === 0 || !checkLetters(letters, state.hand)) {
            console.log('Discard rejected: selected letters are invalid');
            return state;
        }

        let nextState: GameState = {
            ...state,
            ...useLetters(letters, state.hand, state.discard),
        };
        nextState = {
            ...withoutFeedback(nextState),
            ...drawLetters(
                nextState.hand,
                nextState.draw,
                nextState.discard,
                nextState.hand.length + letters.length,
            ),
        };

        socket.emit('state_update', nextState);
        return nextState;
    });
}

/**
 * CLEANUP ON DISCONNECT:
 * Removes the player's state from the map when they disconnect to prevent memory leaks.
 */
export function disconnect(socket: Socket) {
    console.log(
        `User disconnected: ${socket.data.userData.username} / ${socket.id}`,
    );
}

export async function getProgress(userId: number) {
    const state = (await get(userId))?.gameState;
    const hasInProgressRun =
        state != null &&
        !(
            state.status === 'finished' &&
            (state.result === 'GAME_LOST' || state.result === 'GAME_WON')
        );

    return {
        hasInProgressRun,
        currentStage: state?.level ?? 1,
        runScore: state?.run_score ?? 0,
        status: state?.status ?? 'none',
        result: state?.result ?? null,
    };
}

async function updateGameState(
    id: string,
    updater: (prev: GameState | undefined) => GameState | undefined,
) {
    await update(id, (current) => {
        const nextGameState = updater(current.gameState);
        const next = { ...current, gameState: nextGameState };
        return next;
    });
}

function withoutFeedback(state: GameState): GameState {
    const { feedback: _feedback, ...rest } = state;
    return rest;
}
