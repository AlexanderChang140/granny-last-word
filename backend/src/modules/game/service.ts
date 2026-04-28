import type { Socket } from 'socket.io';
import { get, remove, set, update } from './cache.js';
import { GameEngine } from './engine.js';
import type { GameState } from '../../../../shared/types.js';

/**
 * START BATTLE:
 * Triggered when the user presses 'S' or enters a combat zone. (Can Change to 'Enter' or other key)
 * Initializes a fresh state for this specific connection.
 */
export async function startBattle(socket: Socket) {
    const userId = socket.data.userData.id;

    let state = (await get(userId))?.gameState;

    if (!state) {
        state = GameEngine.setupNewBattle();
        await set(userId, { gameState: state });
    }
    socket.emit('state_update', state);
}

/**
 * PROCESS PLAYER ACTION:
 * Triggered when the user submits a word (Spacebar in the tester).
 */
export async function submitWord(socket: Socket, letters: number[]) {
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

        console.log('Processing Player Attack...');
        console.log('Enemy HP before attack:', state.enemy_hp);

        const newState = GameEngine.submitWord(state, letters);

        console.log('Enemy HP after attack:', newState.enemy_hp);
        socket.emit('state_update', newState);
        return newState;
    });
}

export async function endTurn(socket: Socket) {
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

        const newState = GameEngine.end_turn(state);

        socket.emit('state_update', newState);
        return newState;
    });
}

/**
 * CLEANUP ON DISCONNECT:
 * Removes the player's state from the map when they disconnect to prevent memory leaks.
 */
export function disconnect(socket: Socket) {
    const sessionId = socket.data.userData.id;
    remove(sessionId);
    console.log(
        `User disconnected: ${socket.data.userData.username} / ${socket.id}`,
    );
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
