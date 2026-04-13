import { scoreWord } from "./word/validation.js";

// State Definitions 
export interface GameState {
    player_hp: number;
    enemy_hp: number;
    turn_owner: 'player' | 'enemy';
    status: 'running' | 'finished';
}

export interface Action {
    type: 'PLAYER_ACTION' | 'ENEMY_ACTION'
    word?: string
}

/**
 * This should house all the core game logic. It is meant to be an intuitive interface for the game. 
 * Ideally, no databases or sockets should be touched here - it should just be logic.
 */
export class GameEngine {

    static setupNewBattle(): GameState {
        return {
            player_hp: 100,
            enemy_hp: 100,
            turn_owner: 'player',
            status: 'running'
        };
    }

    /**
     * This is where the majority of the game logic will be. This handles all the state transitions and game rules.
     * @param state - The current HP and Turn status.
     * @param action - Object containing 'type' (PLAYER_ACTION/ENEMY_ACTION) and optional data.
     * @returns A brand new GameState object.
     */
    static update(state: GameState, action: Action): GameState {
        // Create a copy so the original remains unchanged/immutable
        const nextState = { ...state };

        console.log("Engine received action type:", action.type);

        // Handle Player Action
        if (action.type === 'PLAYER_ACTION' && action.word) {
            console.log("Match found! Reducing Enemy HP...");

            const score = scoreWord(action.word);
            if (score === 0) {
                return state;
            }

            nextState.enemy_hp -= score;
            nextState.turn_owner = 'enemy';
        }

        // Handle Enemy Turn
        if (action.type === 'ENEMY_ACTION') {
            nextState.player_hp -= 10; // Placeholder damage
            nextState.turn_owner = 'player';
        }

        // Check Win/Loss Condition
        if (nextState.enemy_hp <= 0 || nextState.player_hp <= 0) {
            nextState.status = 'finished';
        }

        return nextState;
    }
}