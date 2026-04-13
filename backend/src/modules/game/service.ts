import type { Socket } from "socket.io";
import { remove, set, update } from "./cache.js";
import { GameEngine, type GameState } from "./engine.js";

/**
 * START BATTLE:
 * Triggered when the user presses 'S' or enters a combat zone. (Can Change to 'Enter' or other key)
 * Initializes a fresh state for this specific connection.
 */
export async function startBattle(socket: Socket) {
    const initialState = GameEngine.setupNewBattle();

    await set(socket.id, {
        gameState: initialState,
    });

    socket.emit("state_update", initialState);
}

/**
 * PROCESS PLAYER ACTION:
 * Triggered when the user submits a word (Spacebar in the tester).
 */
export async function submitWord(socket: Socket, payload: any) {
    await updateGameState(socket.id, (state) => {
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

        let newState = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: payload.word,
        });

        console.log("Enemy HP after attack:", newState.enemy_hp);

        /**
         * ENEMY TURN SIMULATION:
         */
        if (newState.turn_owner === 'enemy' && newState.status === "running") {
            newState = GameEngine.update(newState, {
                type: 'ENEMY_ACTION',
            });
        }

        socket.emit('state_update', newState);
        return newState;
    });
}

/**
 * CLEANUP ON DISCONNECT:
 * Removes the player's state from the map when they disconnect to prevent memory leaks.
 */
export function disconnect(socket: Socket) {
    remove(socket.id);
    console.log(`User disconnected: ${socket.id}`);
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