import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http'; 
import { Server } from 'socket.io';
import router from './modules/example/routes.js';
import authRouter from './modules/auth/routes.js';
import { connect } from './modules/game/socket.js';


/**
 * MAIN SERVER ENTRY POINT:
 * This file manages WebSocket connections and maps users to their active battle states.
 */

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// SETUP: Creates the HTTP server and attaches Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // TODO: Replace with frontend URL
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());

// REST Routes (Auth/Settings)
app.use('/', router);
app.use('/api', authRouter);

// A Map to store active game sessions in memory.
// Key: Socket ID (the unique connection) | Value: GameState object
const activeBattles = new Map();

io.on("connection", (socket) => {
   connect(socket);
});

// Start the server
httpServer.listen(PORT, () => {
    console.log(`Granny's Last Word Server running on http://localhost:${PORT}`);
});