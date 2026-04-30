import {
    checkLetters,
    createWeightedDrawPile,
    drawLetters,
    parseWord,
    useLetters,
} from './deck.js';
import { scoreWord } from './word/validation.js';

import type { GameState, Letter } from '../../../../shared/types.js';

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
        const enemyMaxHp = LEVEL_MAP[level] || 200;
        let draw = createWeightedDrawPile();
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
            player_max_hp: 100,
            enemy_hp: enemyMaxHp, // 200 fallback for levels above 5
            enemy_max_hp: enemyMaxHp,
            level,
            turn_number: 1,
            turn_owner: 'player',
            status: 'running',
            run_score: 0,
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
            return {
                ...state,
                feedback: 'Wait for your turn',
            };
        }

        // Check if letters of word exists in hand
        if (!checkLetters(word, nextState.hand)) {
            console.log('Letters do not exist in hand');
            return {
                ...state,
                feedback: 'Invalid word\nTry again',
            };
        }

        // Check and score if letters make up valid word
        const letters = parseWord(word, nextState.hand);
        const score = scoreWord(letters);
        console.log(`Score: ${score}`);
        if (score === 0) {
            console.log('Invalid word');
            return {
                ...state,
                feedback: 'Invalid word\nTry again',
            };
        }

        // Move letters to discard
        nextState = {
            ...nextState,
            ...useLetters(word, nextState.hand, nextState.discard),
        };
        nextState = {
            ...withoutFeedback(nextState),
            ...drawLetters(
                nextState.hand,
                nextState.draw,
                nextState.discard,
                getHandSize(nextState),
            ),
            run_score: nextState.run_score + score,
        };

        nextState.enemy_hp -= score * 3;

        nextState = this.checkBattleWinState(nextState);

        return nextState;
    }

    static end_turn(state: GameState): GameState {
        let nextState = { ...state };

        console.log('Engine received action type: end_turn');

        // Handle Enemy Turn
        if (state.turn_owner !== 'player') {
            console.log('Cannot end turn: Not player turn');
        }

        // Draw new letters
        nextState = {
            ...withoutFeedback(nextState),
            ...drawLetters(
                nextState.hand,
                nextState.draw,
                nextState.discard,
                getHandSize(nextState),
            ),
            turn_owner: 'enemy',
        };

        // Scale damage based on level
        const damagePerLevel = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18 };
        const currentLevel = nextState.level as keyof typeof damagePerLevel;
        console.log(`Current Level: ${currentLevel}`);
        console.log(`Current Damage: ${damagePerLevel[currentLevel]}`);

        nextState.player_hp -= damagePerLevel[currentLevel];
        nextState.turn_owner = 'player';
        nextState.turn_number += 1;

        nextState = this.checkBattleWinState(nextState);

        return nextState;
    }

    static checkBattleWinState(state: GameState) {
        let nextState: GameState = { ...state };

        if (nextState.player_hp <= 0) {
            // Player dies -> total loss
            nextState.status = 'finished';
            nextState.result = 'GAME_LOST';
        } else if (nextState.enemy_hp <= 0) {
            // Enemy dies -> round win or game win if final level
            nextState.status = 'finished';

            if (nextState.level >= 5) {
                // Game win
                nextState.result = 'GAME_WON';
            } else {
                nextState.result = 'ROUND_WON';
            }
        }
        return nextState;
    }

    static continueToNextStage(state: GameState): GameState {
        if (state.status !== 'finished' || state.result !== 'ROUND_WON') {
            return state;
        }

        const nextLevel = Math.min(state.level + 1, 5);
        const nextBattle = this.setupNewBattle(nextLevel);
        return {
            ...nextBattle,
            player_hp: nextBattle.player_max_hp,
            player_max_hp: state.player_max_hp,
            run_score: state.run_score,
        };
    }
}

const DEFAULT_HAND_SIZE = 10;

function getHandSize(gameState: GameState) {
    return DEFAULT_HAND_SIZE;
}

function withoutFeedback(state: GameState): GameState {
    const { feedback: _feedback, ...rest } = state;
    return rest;
}
