import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({
  origin: ["https://hungnguyen922.github.io"], // your front-end domain
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://hungnguyen922.github.io"],
    methods: ["GET", "POST"]
  }
});

// store all active games in memory
const games = {};

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", (gameId) => {
    socket.join(gameId);
    if (!games[gameId]) games[gameId] = { slots: {}, players: {} };
    console.log(`Player ${socket.id} joined room ${gameId}`);
    io.to(socket.id).emit("gameState", games[gameId]); // send current state only to new player
  });

  socket.on("updateGame", ({ gameId, newState }) => {
    if (!games[gameId]) return;
    // merge new state into existing one
    games[gameId] = { ...games[gameId], ...newState };

    // broadcast updated state to *everyone* in the room (including sender)
    io.to(gameId).emit("gameState", games[gameId]);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
