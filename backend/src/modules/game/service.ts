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
         * CHECK FOR ROUND END or GAME END
         * If the player cleared the round, start the next round.
         */
        if (newState.status === 'finished') {
            if (newState.result === 'GAME_WON') {
                console.log('Final level cleared. Game won!');

                socket.emit('state_update', newState);
                return newState;
            }

            if (newState.result === 'ROUND_WON') {
                console.log('Level ${newState.level} cleared. Starting new round - level ${newState.level + 1}');

                newState = GameEngine.setupNewBattle(newState.level + 1);

                socket.emit('state_update', newState);
                return newState;
            }
        }
        
        /**
         * ENEMY TURN SIMULATION and GAME LOSS CHECK
         */
        if (newState.turn_owner === 'enemy' && newState.status === "running") {
            newState = GameEngine.update(newState, {
                type: 'ENEMY_ACTION',
            });

            // GAME LOSS CHECK
            if (newState.result === 'GAME_LOST') {
                console.log('GAME LOST!');
                socket.emit('state_update', newState);
            }
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