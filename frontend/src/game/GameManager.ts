import { io, Socket } from "socket.io-client";

export interface GameState {
    player_hp: number;
    enemy_hp: number;
    turn_owner: "player" | "enemy";
    status: "running" | "finished";
}

export type ConnectionState = {
    connected: boolean;
    lastError: string | null;
};

type GameClientOptions = {
    onStateChange: (state: GameState) => void;
    onConnectionChange?: (state: ConnectionState) => void;
};

export class GameClient {
    private socket: Socket;
    private onStateChange: (state: GameState) => void;
    private onConnectionChange?: (state: ConnectionState) => void;

    constructor(options: GameClientOptions) {
        this.onStateChange = options.onStateChange;
        this.onConnectionChange = options.onConnectionChange;

        this.socket = io("http://localhost:3000", {
            transports: ["websocket"],
            withCredentials: true,
        });

        this.socket.on("connect", () => {
            this.onConnectionChange?.({ connected: true, lastError: null });
        });

        this.socket.on("disconnect", (reason) => {
            this.onConnectionChange?.({ connected: false, lastError: reason });
        });

        this.socket.on("connect_error", (error) => {
            this.onConnectionChange?.({ connected: false, lastError: error.message });
        });

        this.socket.on("state_update", (state: GameState) => {
            this.onStateChange(state);
        });
    }

    startBattle() {
        this.socket.emit("start_battle");
    }

    sendAction(word: string) {
        this.socket.emit("submit_word", { word });
    }

    destroy() {
        this.socket.removeAllListeners();
        this.socket.disconnect();
    }
}
