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

    static submitWord(state: GameState, word: number[]): GameState {
        // Create a copy so the original remains unchanged/immutable
        let nextState = { ...state };

        console.log('Engine received action type: submit_word');

        if (state.turn_owner !== 'player') {
            console.log('Cannot submit word: Not player turn');
        }

        // Check if letters of word exists in hand
        if (!checkLetters(word, nextState.hand)) {
            console.log('Letters do not exist in hand');
            return nextState;
        }

        // Check and score if letters make up valid word
        const letters = parseWord(word, nextState.hand);
        const score = scoreWord(letters);
        if (score === 0) {
            console.log(`Invalid word: ${letters.map((l) => l.letter).join()}`);
            return nextState;
        }

        console.log('Match found! Reducing Enemy HP...');

        // Move letters to discard
        nextState = {
            ...nextState,
            ...useLetters(word, nextState.hand, nextState.discard),
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

        // Check Win/Loss Condition
        if (nextState.enemy_hp <= 0 || nextState.player_hp <= 0) {
            nextState.status = 'finished';
        }

        return nextState;
    }

    static end_turn(state: GameState): GameState {
        let nextState = { ...state };

        console.log('Engine received action type: end_turn');

        // Handle Enemy Turn
        if (state.turn_owner !== 'player') {
            console.log('Cannot end turn: Not player turn');
        }

        nextState.player_hp -= 10; // Placeholder damage
        nextState.turn_owner = 'player';
        return nextState;
    }
}

const DEFAULT_HAND_SIZE = 7;

function getHandSize(gameState: GameState) {
    return DEFAULT_HAND_SIZE;
}
