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

export interface ServerToClientEvents {
    state_update: (state: GameState) => void;
}

export interface ClientToServerEvents {
    get_progress: () => void;
    start_battle: () => void;
    submit_word: (letters: number[]) => void;
    discard_letters: (letters: number[]) => void;
    end_turn: () => void;
    disconnect: () => void;
}
