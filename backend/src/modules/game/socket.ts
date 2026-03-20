
import type { Socket } from "socket.io";
import { GameEngine, type GameState } from "./engine.js";

// A Map to store active game sessions in memory.
// Key: Socket ID (the unique connection) | Value: GameState object
const activeBattles = new Map();

export function connect(socket: Socket) {
    console.log(`User connected: ${socket.id}`);

    /**
     * START BATTLE:
     * Triggered when the user presses 'S' or enters a combat zone. (Can Change to 'Enter' or other key)
     * Initializes a fresh state for this specific connection.
     */
    socket.on("start_battle", () => {
        const initialState = GameEngine.setupNewBattle();
        activeBattles.set(socket.id, initialState);
        
        // Sends the initial state to the client
        socket.emit("state_update", initialState);
    });

    /**
     * PROCESS PLAYER ACTION:
     * Triggered when the user submits a word (Spacebar in the tester).
     */ 
    socket.on("submit_word", (payload) => {
        let state = activeBattles.get(socket.id);

        // TURN GUARD: Only process if it is the player's turn 
        // Prevents attacks during enemy turn or after battle ends
        if (!state || state.turn_owner !== 'player' || state.status !== 'running') {
            console.log("ACTION BLOCKED - Not player's turn or battle not running");
            console.log("State:", state);
            return;
        }

        console.log("Processing Player Attack...");
        console.log("Enemy HP before attack:", state.enemy_hp);

        // Use the engine to process the player's action and calculate the new state
        state = GameEngine.update(state, { type: 'PLAYER_ACTION', word: payload.word });

        console.log("Enemy HP after attack:", state.enemy_hp);

        // Save the updated state back to the map
        activeBattles.set(socket.id, state);

        // Notify client of damage and new state so the scene can update
        socket.emit("state_update", state);

        /**
         * ENEMY TURN SIMULATION:
         * If the game isn't over, we trigger a delayed response from the "Enemy AI".
         */
        if (state.status === 'running') {
            setTimeout(() => {
                let currentState = activeBattles.get(socket.id);
                const newState = GameEngine.update(currentState, { type: 'ENEMY_ACTION' });
                activeBattles.set(socket.id, newState);
                
                socket.emit("state_update", newState);
            }, 1000); // 1-second delay for "Enemy Thinking"
        }
    });

    /**
     * CLEANUP ON DISCONNECT:
     * Removes the player's state from the map when they disconnect to prevent memory leaks.
     */
    socket.on("disconnect", () => {
        activeBattles.delete(socket.id);
        console.log(`User disconnected: ${socket.id}`);
    });
}
