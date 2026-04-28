import { io, Socket } from 'socket.io-client';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from '../../shared/types';

const URL = 'http://localhost:3000';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    URL,
    {
        autoConnect: true,
        withCredentials: true,
    },
);
