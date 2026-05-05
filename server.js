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

  socket.on("joinGame", (gameId, playerDeck) => {
    socket.join(gameId);
    if (!games[gameId]) {
      games[gameId] = { 
        slots: {}, 
        players: {}, 
        decks: {}, 
        hands: {}, 
        drawPile: [] 
      };
    }
  
    // Assign this player's deck (array of cards)
    games[gameId].decks[socket.id] = playerDeck || [];
  
    // Optionally initialize their hand
    games[gameId].hands[socket.id] = [];
  
    console.log(`Player ${socket.id} joined room ${gameId}`);
    io.to(socket.id).emit("gameState", games[gameId]); // send full state to new player
  });

  socket.on("updateState", ({ gameId, patch }) => {
    if (!games[gameId]) return;

    // merge patch into game state
    Object.keys(patch).forEach(key => {
      if (typeof patch[key] === "object" && !Array.isArray(patch[key])) {
        games[gameId][key] = {
          ...games[gameId][key],
          ...patch[key]
        };
      } else {
        games[gameId][key] = patch[key];
      }
    });

    io.to(gameId).emit("gameState", games[gameId]);
});


  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
