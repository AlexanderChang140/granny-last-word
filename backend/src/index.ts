import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import router from './modules/example/routes.js';
import authRouter from './modules/auth/routes.js';
import { connect } from './modules/game/socket.js';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from '../../shared/types.js';
import forumRouter from './modules/forum/routes.js';

import cookie from 'cookie';
import { validateSession } from './modules/auth/service.js';

/**
 * MAIN SERVER ENTRY POINT:
 * This file manages WebSocket connections and maps users to their active battle states.
 */

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// SETUP: Creates the HTTP server and attaches Socket.io
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(express.json());

// REST Routes (Auth/Settings)
app.use('/', router);
app.use('/api', authRouter);
app.use('/api/forum', forumRouter);

io.use(async (socket, next) => {
    const rawCookies = socket.handshake.headers.cookie || '';
    const cookies = cookie.parse(rawCookies);
    const token = cookies.token;
    const userData = token ? await validateSession(token) : null;
    if (!token || !userData) {
        return next(new Error('Authentication error'));
    }

    socket.data.userData = userData;
    next();
});

io.on('connection', (socket) => {
    connect(socket);
});

// Start the server
httpServer.listen(PORT, () => {
    console.log(
        `Granny's Last Word Server running on http://localhost:${PORT}`,
    );
});
