// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow all origins for now
    },
});

const games = {}; // store game states by gameId

io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    socket.on("joinGame", (gameId) => {
        socket.join(gameId);
        console.log(`Player ${socket.id} joined game ${gameId}`);

        // Create game if not existing
        if (!games[gameId]) {
            games[gameId] = {
                players: {},
                state: {}, // you can fill in whatever structure you want here
            };
        }

        // Send current state back to player
        io.to(gameId).emit("gameState", games[gameId].state);
    });

    socket.on("updateGame", ({ gameId, newState }) => {
        if (games[gameId]) {
            games[gameId].state = newState;
            io.to(gameId).emit("gameState", newState); // broadcast to everyone in that game
        }
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
