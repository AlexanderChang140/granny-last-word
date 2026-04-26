import {
    arrToLetters,
    checkLetters,
    drawLetters,
    parseWord,
    useLetters,
} from './deck.js';
import { scoreWord } from './word/validation.js';

// State Definitions
export interface Letter {
    id: number;
    letter: string;
}

export interface Action {
    type: 'PLAYER_ACTION' | 'ENEMY_ACTION';
    word?: number[];
}

export interface GameState {
    player_hp: number;
    enemy_hp: number;
    level: number;
    turn_owner: 'player' | 'enemy';
    status: 'running' | 'finished';
    result?: 'ROUND_WON' | 'GAME_WON' | 'GAME_LOST';
    draw: Letter[];
    discard: Letter[];
    hand: Letter[];
}

const LEVEL_MAP: Record<number, number> = {
    1: 100,
    2: 125,
    3: 150,
    4: 175,
    5: 200,
};


/**
 * This should house all the core game logic. It is meant to be an intuitive interface for the game.
 * Ideally, no databases or sockets should be touched here - it should just be logic.
 */
export class GameEngine {
    static setupNewBattle(level: number = 1): GameState {
        const handSize = DEFAULT_HAND_SIZE;
        let draw = arrToLetters(['a', 'b', 'c', 'd', 'e', 'f', 't']);
        let hand: Letter[] = [];
        for (let i = 0; i < handSize; i++) {
            const letter = draw.pop();
            if (letter === undefined) {
                break;
            }
            hand.push(letter);
        }

        return {
            player_hp: 100,
            enemy_hp: LEVEL_MAP[level] || 200, //200 used as fallback for levels above 5
            level,
            turn_owner: 'player',
            status: 'running',
            draw,
            discard: [],
            hand,
        };
    }

    /**
     * This is where the majority of the game logic will be. This handles all the state transitions and game rules.
     * @param state - The current HP and Turn status.
     * @param action - Object containing 'type' (PLAYER_ACTION/ENEMY_ACTION) and optional data.
     * @returns A brand new GameState object.
     */
    static update(state: GameState, action: Action): GameState {
        // Create a deep copy so arrays aren't shared with original state
        let nextState: GameState = {
            ...state,
            hand: [...state.hand],
            draw: [...state.draw],
            discard: [...state.discard],
        };

        console.log('Engine received action type:', action.type);

        // Handle Player Action
        if (action.type === 'PLAYER_ACTION' && action.word) {

            // Check if letters of word exists in hand
            if (!checkLetters(action.word, nextState.hand)) {
                return nextState;
            }

            // Check and score if letters make up valid word
            const letters = parseWord(action.word, nextState.hand);
            const score = scoreWord(letters);
            console.log(`Score: ${score}`);
            if (score === 0) {
                console.log('Invalid word, player loses turn.');
                nextState.turn_owner = 'enemy'; // pass turn to enemy to deal damage
                return nextState;
            }

            // Move letters to discard
            nextState = {
                ...nextState,
                ...useLetters(action.word, nextState.hand, nextState.discard),
            };

            // Draw new letters
            nextState = {
                ...nextState,
                ...drawLetters(
                    nextState.hand,
                    nextState.draw,
                    nextState.discard,
                    getHandSize(nextState),
                ),
            };

            nextState.enemy_hp -= score;
            nextState.turn_owner = 'enemy';
        }

        // Handle Enemy Turn
        if (action.type === 'ENEMY_ACTION') {
            nextState.player_hp -= 10; // Placeholder damage
            nextState.turn_owner = 'player';
        }

        // Check Win/Loss Conditions
        if (nextState.player_hp <= 0) {    // Player dies -> total loss
            nextState.status = 'finished';
            nextState.result = 'GAME_LOST';
        }
            
        else if (nextState.enemy_hp <= 0) { // Enemy dies -> round win or game win if final level
            nextState.status = 'finished';

            if (nextState.level >= 5) { // Game win
                nextState.result = 'GAME_WON';
            }
            else {
                nextState.result = 'ROUND_WON';
            }
        }

        return nextState;
    }
}

const DEFAULT_HAND_SIZE = 7;

function getHandSize(gameState: GameState) {
    return DEFAULT_HAND_SIZE;
}
