import express from "express";
const app = express();
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import ACTIONS from "./Actions.js";

app.use(cors());
const server = http.createServer(app);

const clientURL = process.env.CLIENT_URL;
const io = new Server(server, {
  cors: {
    origin: clientURL,
    methods: ["GET", "POST"],
  },
});

// We are storing this in our memory, if the server restarts this will be delteted
//For production level application this should not be used
//For Productin level applications memeory databse like Reddis should be considered, also it can be stored in database also can be stored in files
const userSocketMap = {};
function getAllConnectedClients(roomId) {
  //Map (io.sockets.adapter.rooms - this returns map)
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log(`socket connected`, socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // console.log(clients);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    // We are listening here for the code coming from client
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
