import type { Socket } from 'socket.io';
import {
    continueStage,
    discardLetters,
    disconnect,
    endTurn,
    startBattle,
    submitWord,
} from './service.js';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from '../../../../shared/types.js';

export function connect(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
    console.log('User connected:');
    console.table({
        'Session ID': socket.id,
        Username: socket.data.userData?.username,
    });

    socket.onAny((eventName, ...args) => {
        console.log(
            `[EVENT RECEIVED] Name: ${eventName} | User: ${socket.data.userData?.username}`,
        );
        console.log(`Payload:`, args);
    });

    socket.on('start_battle', async (forceReset) => {
        startBattle(socket, forceReset);
    });
    socket.on('continue_stage', async () => {
        continueStage(socket);
    });

    socket.on('submit_word', async (letters) => {
        submitWord(socket, letters);
    });

    socket.on('discard_letters', async (letters) => {
        discardLetters(socket, letters);
    });

    socket.on('end_turn', async () => {
        endTurn(socket);
    });

    socket.on('disconnect', () => {
        disconnect(socket);
    });
}
