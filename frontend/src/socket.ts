import { io, Socket } from 'socket.io-client';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from '../../shared/types';

/**
 * Session cookies are set on the page origin (e.g. localhost:5173) when using the Vite /api proxy.
 * Socket.IO must use the same origin in dev so `withCredentials` sends the cookie; Vite proxies
 * `/socket.io` to the backend (see vite.config.ts).
 *
 * In production, set `VITE_SOCKET_URL` or `VITE_API_URL` so the client reaches your API host.
 */
function resolveSocketUrl(): string | undefined {
    const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
    if (explicit) return explicit.replace(/\/$/, '');

    if (import.meta.env.PROD) {
        const api = import.meta.env.VITE_API_URL as string | undefined;
        if (api) return new URL(api).origin;
    }

    return undefined;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    resolveSocketUrl(),
    {
        path: '/socket.io/',
        autoConnect: false,
        withCredentials: true,
    },
);
