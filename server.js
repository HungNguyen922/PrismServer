import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const games = {}; // gameId -> current board state

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("joinGame", (gameId) => {
    socket.join(gameId);
    console.log(`Socket ${socket.id} joined ${gameId}`);

    // If no game yet, create empty sandbox state
    if (!games[gameId]) games[gameId] = { board: {}, hands: {}, decks: {} };

    // Send current state to new player
    socket.emit("gameState", games[gameId]);
  });

  socket.on("updateGame", ({ gameId, newState }) => {
    // Replace the state and broadcast to all players in the same room
    games[gameId] = newState;
    io.to(gameId).emit("gameState", newState);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
