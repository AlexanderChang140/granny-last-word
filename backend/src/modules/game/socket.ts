import type { Socket } from "socket.io";
import { disconnect, startBattle, submitWord } from "./service.js";

export function connect(socket: Socket) {
    console.log(`User connected: ${socket.id}`);

    socket.on("start_battle", async () => {
        startBattle(socket);
    });

    socket.on("submit_word", async (payload) => {
        submitWord(socket, payload);
    });

    socket.on("disconnect", () => {
        disconnect(socket);
    });
}
