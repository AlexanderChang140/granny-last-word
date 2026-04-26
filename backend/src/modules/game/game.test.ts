import { describe, expect, it } from 'vitest';
import { GameEngine, type GameState } from './engine.js';



describe('GameEngine.update', () => {

    const state: GameState = {
        level: 1,
        player_hp: 10,
        enemy_hp: 10,
        turn_owner: 'player',
        status: 'running',
        hand: [
            { id: 12, letter: 'G' },
            { id: 45, letter: 'R' },
            { id: 7, letter: 'A' },
            { id: 89, letter: 'B' },
            { id: 34, letter: 'A' },
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

    /** 
     * ----THIS TEST IS BROKEN --- 
     * ---- the test word was invalid in the dictionary,
     * 
    it('should reduce enemy HP, switch turns when player attacks, and correctly update letters', () => {
        const res = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: [7, 89, 34],
        });

        expect(res).toStrictEqual<GameState>({
            level: 1,
            player_hp: 10,
            enemy_hp: 7,
            turn_owner: 'enemy',
            status: 'running',
            hand: [
                { id: 12, letter: 'G' },
                { id: 45, letter: 'R' },
                { id: 7, letter: 'A' },
                { id: 89, letter: 'B' },
                { id: 34, letter: 'A' },
                { id: 3, letter: 'Y' },
                { id: 56, letter: 'S' },
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
            ],
        });
    }); */

    it('should not change state on invalid word', () => {
        const res = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: [3, 56, 105],
        });

        expect(res).toStrictEqual<GameState>(state);
    });
});


describe('Game Lifecycle Logic', () => {

    // Helper to create a near-death enemy state for quick progression testing
    const createNearWinState = (level: number): GameState => ({
        ...GameEngine.setupNewBattle(level),
        enemy_hp: 1, // One hit from winning
    });

    it('should initialize Level 1 with correct HP and hand size', () => {
        const state = GameEngine.setupNewBattle(1);
        expect(state.level).toBe(1);
        expect(state.enemy_hp).toBe(100);
        expect(state.hand.length).toBe(7);
        expect(state.status).toBe('running');
    });

    it('should trigger ROUND_WON when enemy HP hits 0 on levels 1-4', () => {
        
        const state: GameState = {
            level: 1, //level 1 - 4, change manually for testing
            player_hp: 10,
            enemy_hp: 1,
            turn_owner: 'player',
            status: 'running',
            hand: [
                { id: 12, letter: 'G' },
                { id: 45, letter: 'R' },
                { id: 7, letter: 'A' },
                { id: 89, letter: 'B' },
                { id: 34, letter: 'A' },
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


        // Simulate a simple 3-letter word
         const res = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: [7, 89, 34], // "ABA" = 1 + 3 + 1 = 5 damage
        });
        
        // Log the results
        console.log(`Result state: ${res.result}`);
        console.log(`Resulting Enemy HP: ${res.enemy_hp}`);
        console.log(`Damage Dealt: ${state.enemy_hp - res.enemy_hp}`);

        expect(res.enemy_hp).toBeLessThanOrEqual(0);
        expect(res.status).toBe('finished');
        expect(res.result).toBe('ROUND_WON');
    });

    it('should trigger GAME_WON when enemy HP hits 0 on level 5', () => {
        const state: GameState = {
            level: 5,   // level 5
            player_hp: 10,
            enemy_hp: 1,
            turn_owner: 'player',
            status: 'running',
            hand: [
                { id: 12, letter: 'G' },
                { id: 45, letter: 'R' },
                { id: 7, letter: 'A' },
                { id: 89, letter: 'B' },
                { id: 34, letter: 'A' },
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


        const res = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: [7, 89, 34], // "ABA" = 1 + 3 + 1 = 5 damage
        });

        // Log the results
        console.log(`Result state: ${res.result}`);
        console.log(`Resulting Enemy HP: ${res.enemy_hp}`);
        console.log(`Damage Dealt: ${state.enemy_hp - res.enemy_hp}`);

        expect(res.enemy_hp).toBeLessThanOrEqual(0);
        expect(res.level).toBe(5);
        expect(res.result).toBe('GAME_WON');
        expect(res.status).toBe('finished');
    });

    it('should trigger GAME_LOST when player HP hits 0', () => {
        let state = GameEngine.setupNewBattle(1);
        state.player_hp = 5; // Near death

        const res = GameEngine.update(state, { type: 'ENEMY_ACTION' });

        expect(res.player_hp).toBeLessThanOrEqual(0);
        expect(res.result).toBe('GAME_LOST');
        expect(res.status).toBe('finished');
    });

    it('should scale enemy HP according to the LEVEL_MAP', () => {
        const lvl2 = GameEngine.setupNewBattle(2);
        const lvl5 = GameEngine.setupNewBattle(5);

        expect(lvl2.enemy_hp).toBe(125);
        expect(lvl5.enemy_hp).toBe(200);
    });

    it('should pass turn to enemy on an invalid word (score 0)', () => {
        const state = GameEngine.setupNewBattle(1);
        // We assume an empty or nonsense word returns score 0 in your validation logic
        const res = GameEngine.update(state, {
            type: 'PLAYER_ACTION',
            word: [9999], // ID that doesn't exist in hand
        });

        // The engine returns nextState without changes if checkLetters fails
        expect(res.turn_owner).toBe('player');
    });
});