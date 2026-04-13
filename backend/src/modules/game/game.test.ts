import { describe, expect, it } from 'vitest';
import { GameEngine, type GameState } from './engine.js';

describe('GameEngine.update', () => {
    it('should reduce enemy HP and switch turns when player attacks', () => {
        const res = GameEngine.update(
            {
                player_hp: 10,
                enemy_hp: 10,
                turn_owner: 'player',
                status: 'running',
            },
            { type: 'PLAYER_ACTION', word: 'AND' },
        );

        expect(res).toStrictEqual<GameState>({
            player_hp: 10,
            enemy_hp: 6,
            turn_owner: 'enemy',
            status: 'running',
        });
    });

    it('should not change state on invalid word', () => {
        const res = GameEngine.update(
            {
                player_hp: 10,
                enemy_hp: 10,
                turn_owner: 'player',
                status: 'running',
            },
            { type: 'PLAYER_ACTION', word: 'ZZZZZZZZZZ' },
        );

        expect(res).toStrictEqual<GameState>({
            player_hp: 10,
            enemy_hp: 10,
            turn_owner: 'player',
            status: 'running',
        });
    });
});
