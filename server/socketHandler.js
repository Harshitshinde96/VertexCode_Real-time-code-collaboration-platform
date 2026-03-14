import jwt from "jsonwebtoken";
import { Room } from "./models/roomModel.js";
import userModel from "./models/userModel.js";
import ACTIONS from "./Actions.js";
import { executeCode } from "./compilerService.js";
import { redisClient } from "./config/redis.js";

// 🟢 LOOK MA, NO LOCAL VARIABLES!
// const roomState = {};
// const userSocketMap = {};
// const pendingRequests = {};

const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return cookieString.split(";").reduce((res, c) => {
    const [key, val] = c.trim().split("=").map(decodeURIComponent);
    return Object.assign(res, { [key]: val });
  }, {});
};

// 🟢 REDIS UPGRADE: Fetch sockets across ALL servers
async function getAllConnectedClients(io, roomId) {
  const sockets = await io.in(roomId).fetchSockets();
  const clients = [];

  for (const s of sockets) {
    const data = await redisClient.get(`socket:${s.id}`);
    if (data) {
      const parsed = JSON.parse(data);
      clients.push({
        socketId: s.id,
        username: parsed.username,
        role: parsed.role,
      });
    }
  }
  return clients;
}

// 🟢 REDIS UPGRADE: Async host finder
async function getHostSocketId(io, roomId) {
  const clients = await getAllConnectedClients(io, roomId);
  const host = clients.find((c) => c.role === "host");
  return host ? host.socketId : null;
}

export function initSocketHandler(io) {
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.token;
      if (!token)
        return next(new Error("Authentication error: No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) return next(new Error("Authentication error: User not found"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // --- HELPER: ENTRY LOGIC ---
    const admitUserToRoom = async (
      targetSocket,
      roomId,
      role,
      roomDoc = null,
    ) => {
      if (targetSocket.hasBeenAdmitted) return;
      targetSocket.hasBeenAdmitted = true;

      // 🟢 REDIS UPGRADE: Remove from pending hash
      await redisClient.hdel(`pending:${roomId}`, targetSocket.id);

      // 🟢 REDIS UPGRADE: Save user socket info permanently
      await redisClient.set(
        `socket:${targetSocket.id}`,
        JSON.stringify({
          username: targetSocket.pendingData.username,
          role: role,
        }),
        "EX",
        86400, // Auto-delete after 24 hours just in case of ghost sockets
      );

      targetSocket.join(roomId);

      let roomData = await redisClient.hgetall(`room:${roomId}`);
      let codeToSync = roomData.code;
      let langToSync = roomData.language;

      if (!codeToSync) {
        codeToSync =
          roomDoc?.fileTree?.[0]?.content ||
          "// Welcome to VertexCode\n// Start typing here...";
        langToSync = roomDoc?.fileTree?.[0]?.language || "javascript";

        await redisClient.hset(`room:${roomId}`, {
          code: codeToSync,
          language: langToSync,
          stdin: "",
        });
      }

      const clients = await getAllConnectedClients(io, roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
          clients,
          username: targetSocket.pendingData.username,
          role: role,
          socketId: targetSocket.id,
        });
      });

      setTimeout(() => {
        targetSocket.emit(ACTIONS.SYNC_CODE, {
          code: codeToSync,
          language: langToSync,
        });
        targetSocket.emit(ACTIONS.CODE_CHANGE, { code: codeToSync });
      }, 150);

      // 🟢 REDIS UPGRADE: Get all pending requests for the Host
      if (role === "host") {
        const pendingGuests = await redisClient.hvals(`pending:${roomId}`);
        pendingGuests.forEach((guestStr) => {
          const guest = JSON.parse(guestStr);
          targetSocket.emit(ACTIONS.JOIN_REQUEST, {
            guestSocketId: guest.socketId,
            guestName: guest.username,
          });
        });
      }
    };

    // --- 2. THE WAITING ROOM LOGIC ---
    socket.on(ACTIONS.ASK_TO_JOIN, async ({ roomId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room)
          return socket.emit(ACTIONS.ERROR, { message: "Room not found" });

        const isHost = room.host.toString() === socket.user._id.toString();
        const isAllowedGuest = room.allowedGuests.some(
          (id) => id.toString() === socket.user._id.toString(),
        );
        const role = isHost ? "host" : "guest";

        socket.pendingData = { username: socket.user.name, roomId, role };

        if (isHost || room.accessMode === "OPEN" || isAllowedGuest) {
          await admitUserToRoom(socket, roomId, role, room);
          return;
        }

        // 🟢 REDIS UPGRADE: Clean up ghost sockets for this specific user, then add new one
        const existingPending = await redisClient.hvals(`pending:${roomId}`);
        for (const reqStr of existingPending) {
          const req = JSON.parse(reqStr);
          if (req.userId === socket.user._id.toString()) {
            await redisClient.hdel(`pending:${roomId}`, req.socketId);
          }
        }

        await redisClient.hset(
          `pending:${roomId}`,
          socket.id,
          JSON.stringify({
            socketId: socket.id,
            username: socket.user.name,
            userId: socket.user._id.toString(),
          }),
        );

        const hostSocketId = await getHostSocketId(io, roomId);
        if (hostSocketId) {
          io.to(hostSocketId).emit(ACTIONS.JOIN_REQUEST, {
            guestSocketId: socket.id,
            guestName: socket.user.name,
          });
        } else {
          socket.emit(ACTIONS.WAITING_FOR_HOST, {
            message: "Waiting for the host to join...",
          });
        }
      } catch (error) {
        console.error("Ask to Join Error:", error);
      }
    });

    // --- 3. HOST DECISION LOGIC ---
    socket.on(ACTIONS.ADMIT_USER, async ({ guestSocketId, roomId }) => {
      const guestSocket = io.sockets.sockets.get(guestSocketId);
      if (guestSocket && guestSocket.pendingData) {
        try {
          await Room.findOneAndUpdate(
            { roomId },
            { $addToSet: { allowedGuests: guestSocket.user._id } },
          );
        } catch (err) {}
        await admitUserToRoom(guestSocket, roomId, "guest");
      }
    });

    socket.on(ACTIONS.DENY_USER, async ({ guestSocketId, roomId }) => {
      // 🟢 REDIS UPGRADE
      await redisClient.hdel(`pending:${roomId}`, guestSocketId);
      const guestSocket = io.sockets.sockets.get(guestSocketId);
      if (guestSocket)
        guestSocket.emit(ACTIONS.REQUEST_DENIED, {
          message: "The host declined your request to join.",
        });
    });

    // --- 4. STANDARD EVENTS ---
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
      redisClient.hset(`room:${roomId}`, "code", code);
      socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.RUN_CODE, async ({ roomId, language, code, stdin }) => {
      await redisClient.hset(`room:${roomId}`, {
        code,
        stdin: stdin || "",
        language,
      });
      io.to(roomId).emit(ACTIONS.CODE_RUNNING);
      const { output, error, waitingForInput } = await executeCode(
        language,
        code,
        stdin || "",
      );
      io.to(roomId).emit(ACTIONS.CODE_OUTPUT, {
        output,
        error,
        waitingForInput,
      });
    });

    socket.on(ACTIONS.PROVIDE_INPUT, async ({ roomId, input }) => {
      const roomData = await redisClient.hgetall(`room:${roomId}`);
      if (!roomData.code) return;

      const newStdin = (roomData.stdin || "") + `${input}\n`;
      await redisClient.hset(`room:${roomId}`, "stdin", newStdin);

      const { output, error, waitingForInput } = await executeCode(
        roomData.language,
        roomData.code,
        newStdin,
      );
      io.to(roomId).emit(ACTIONS.CODE_OUTPUT, {
        output,
        error,
        waitingForInput,
      });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, newLanguage }) => {
      redisClient.hset(`room:${roomId}`, "language", newLanguage);
      socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { newLanguage });
    });

    socket.on(ACTIONS.STDIN_CHANGE, ({ roomId, newInput }) => {
      redisClient.hset(`room:${roomId}`, "stdin", newInput);
      socket.in(roomId).emit(ACTIONS.STDIN_CHANGE, { newInput });
    });

    // --- 5. DISCONNECT LOGIC ---
    socket.on("disconnecting", async () => {
      const rooms = [...socket.rooms];

      // 🟢 REDIS UPGRADE: Fetch user data before deleting it
      const userDataStr = await redisClient.get(`socket:${socket.id}`);
      const username = userDataStr ? JSON.parse(userDataStr).username : null;

      for (const roomId of rooms) {
        // Clean up queue if they leave while waiting
        await redisClient.hdel(`pending:${roomId}`, socket.id);

        if (username) {
          try {
            const finalCode = await redisClient.hget(`room:${roomId}`, "code");
            if (finalCode) {
              await Room.findOneAndUpdate(
                { roomId },
                { $set: { "fileTree.0.content": finalCode } },
              );
            }
          } catch (err) {}
        }

        socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: username,
        });
      }

      // 🟢 REDIS UPGRADE: Delete socket data
      await redisClient.del(`socket:${socket.id}`);
      socket.leave();
    });
  });
}
