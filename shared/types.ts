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
    player_max_hp: number;
    enemy_hp: number;
    enemy_max_hp: number;
    level: number;
    turn_owner: 'player' | 'enemy';
    turn_number: number;
    status: 'running' | 'finished';
    result?: 'ROUND_WON' | 'GAME_WON' | 'GAME_LOST';
    feedback?: string;
    run_score: number;
    draw: Letter[];
    discard: Letter[];
    hand: Letter[];
}

export interface ServerToClientEvents {
    state_update: (state: GameState) => void;
}

export interface ClientToServerEvents {
    get_progress: () => void;
    start_battle: (forceReset?: boolean) => void;
    continue_stage: () => void;
    submit_word: (letters: number[]) => void;
    discard_letters: (letters: number[]) => void;
    end_turn: () => void;
    disconnect: () => void;
}
