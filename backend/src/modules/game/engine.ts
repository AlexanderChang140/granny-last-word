import {
    arrToLetters,
    checkLetters,
    drawLetters,
    parseWord,
    useLetters,
} from './deck.js';
import { scoreWord } from './word/validation.js';

import type { GameState, Letter } from '../../../../shared/types.js';

/**
 * This should house all the core game logic. It is meant to be an intuitive interface for the game.
 * Ideally, no databases or sockets should be touched here - it should just be logic.
 */
export class GameEngine {
    static setupNewBattle(): GameState {
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
            enemy_hp: 100,
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
        // Create a copy so the original remains unchanged/immutable
        let nextState = { ...state };

        console.log('Engine received action type:', action.type);

        // Handle Player Action
        if (action.type === 'PLAYER_ACTION' && action.word) {
            console.log('Match found! Reducing Enemy HP...');

            // Check if letters of word exists in hand
            if (!checkLetters(action.word, nextState.hand)) {
                return nextState;
            }

            // Check and score if letters make up valid word
            const letters = parseWord(action.word, nextState.hand);
            const score = scoreWord(letters);
            if (score === 0) {
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

        // Check Win/Loss Condition
        if (nextState.enemy_hp <= 0 || nextState.player_hp <= 0) {
            nextState.status = 'finished';
        }

        return nextState;
    }
}

const DEFAULT_HAND_SIZE = 7;

function getHandSize(gameState: GameState) {
    return DEFAULT_HAND_SIZE;
}
