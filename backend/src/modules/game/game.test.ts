import { describe, expect, it } from 'vitest';
import { GameEngine } from './engine.js';
import type { GameState } from '../../../../shared/types.js';

describe('GameEngine.update', () => {
    const state: GameState = {
        player_hp: 10,
        enemy_hp: 10,
        turn_owner: 'player',
        status: 'running',
        hand: [
            { id: 12, letter: 'G' },
            { id: 45, letter: 'R' },
            { id: 7, letter: 'A' },
            { id: 89, letter: 'N' },
            { id: 22, letter: 'N' },
            { id: 3, letter: 'Y' },
            { id: 56, letter: 'S' },
        ],
        draw: [
            { id: 101, letter: 'W' },
            { id: 102, letter: 'O' },
            { id: 103, letter: 'R' },
            { id: 104, letter: 'D' },
            { id: 105, letter: 'Q' },
            { id: 106, letter: 'U' },
            { id: 107, letter: 'I' },
            { id: 108, letter: 'Z' },
        ],
        discard: [
            { id: 1, letter: 'T' },
            { id: 2, letter: 'E' },
            { id: 15, letter: 'S' },
            { id: 19, letter: 'T' },
        ],
    };

    it('should reduce enemy HP, switch turns when player attacks, and correctly update letters', () => {
        const res = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: [45, 7, 22],
        });

        expect(res).toStrictEqual<GameState>({
            player_hp: 10,
            enemy_hp: 7,
            turn_owner: 'enemy',
            status: 'running',
            hand: [
                { id: 12, letter: 'G' },
                { id: 89, letter: 'N' },
                { id: 3, letter: 'Y' },
                { id: 56, letter: 'S' },
                { id: 108, letter: 'Z' },
                { id: 107, letter: 'I' },
                { id: 106, letter: 'U' },
            ],
            draw: [
                { id: 101, letter: 'W' },
                { id: 102, letter: 'O' },
                { id: 103, letter: 'R' },
                { id: 104, letter: 'D' },
                { id: 105, letter: 'Q' },
            ],
            discard: [
                { id: 1, letter: 'T' },
                { id: 2, letter: 'E' },
                { id: 15, letter: 'S' },
                { id: 19, letter: 'T' },
                { id: 45, letter: 'R' },
                { id: 7, letter: 'A' },
                { id: 22, letter: 'N' },
            ],
        });
    });

    it('should not change state on invalid word', () => {
        const res = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: [3, 56, 105],
        });

        expect(res).toStrictEqual<GameState>(state);
    });
});
