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
        drawPile: [],
        extraDeck: []
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
  
    const state = games[gameId];
  
    // Replaces slots
    if (patch.slots) {
      state.slots = patch.slots;
    }
  
    // Merge hands
    if (patch.hands) {
      Object.keys(patch.hands).forEach(pid => {
        state.hands[pid] = patch.hands[pid];
      });
    }
  
    // Replace draw pile
    if (patch.drawPile) {
      state.drawPile = patch.drawPile.slice();
    }
  
    // Replace extra deck
    if (patch.extraDeck) {
      state.extraDeck = patch.extraDeck.slice();
    }
  
    io.to(gameId).emit("gameState", state);
  });
  
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
