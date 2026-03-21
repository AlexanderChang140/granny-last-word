import { io, Socket } from 'socket.io-client';

export interface GameState {
    player_hp: number;
    enemy_hp: number;
    turn_owner: 'player' | 'enemy';
    status: 'running' | 'finished';
}

/**
 * GameClient: The "Bridge" between frontend and backend
 * This class manages the WebSocket connection and state updates.
 */
export class GameClient {
    private socket: Socket;
    private onStateChange: (state: GameState) => void;

    /**
     * Constructor: Establishes the WebSocket connection
     * @param onStateChange Callback function that triggers each time the server sends a new GameState.
     */
    constructor(onStateChange: (state: GameState) => void) {
        this.onStateChange = onStateChange;  
        this.socket = io('http://localhost:3000');

        // Listen for state updates from the server
        this.socket.on('state_update', (state) => this.onStateChange(state));
    }

    /**
     * Tells the server to initialize a new battle.
     * Should execute when the player clicks "Start".
     */
    startBattle() {
        this.socket.emit("start_battle");
    }

    /**
     * Update the Phaser Scene based on game state
     * @param scene - The active Phaser Scene instance (usually 'this' in Phaser)
     * @param state - The fresh GameState received from the server
     */
    updatePhaserScene(scene: any, state: GameState) {
        // TODO: Implement Phaser scene updates
        scene.playerBar.setValue(state.player_hp);
        

        if (state.turn_owner === 'player') scene.showPlayerTurn();
    }

    /**
     * Sends the player's word submission to the server.
     * @param word - The string the player typed.
     */
    sendAction(word: string) {
        this.socket.emit('submit_word', { word }); 
    }
}