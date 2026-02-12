import express from "express";
const app = express();
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { initSocketHandler } from "./socketHandler.js";

app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// --- Initialize all socket logic ---
initSocketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
