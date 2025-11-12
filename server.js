import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// simple route for testing
app.get("/", (req, res) => res.send("Server is running!"));

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinGame", (gameId) => {
        socket.join(gameId);
        console.log(`${socket.id} joined ${gameId}`);
    });

    socket.on("updateGame", ({ gameId, state }) => {
        io.to(gameId).emit("gameState", state);
    });

    socket.on("disconnect", () => console.log("A user disconnected:", socket.id));
});

// Render sets process.env.PORT automatically
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));