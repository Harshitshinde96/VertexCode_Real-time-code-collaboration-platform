import ACTIONS from "./Actions.js";
import { executeCode } from "./compilerService.js";

// This map will hold our room state (like accumulated input)
// This is still in-memory and will reset, but it's cleaner.
const roomState = {};

function getAllConnectedClients(io, roomId) {
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

// We are storing this in our memory, if the server restarts this will be delteted
//For production level application this should not be used
//For Productin level applications memeory databse like Reddis should be considered, also it can be stored in database also can be stored in files

// We'll store user data here.
const userSocketMap = {};

export function initSocketHandler(io) {
  io.on("connection", (socket) => {
    // console.log(`socket connected`, socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
      userSocketMap[socket.id] = username;
      socket.join(roomId);

      // Initialize room state if it doesn't exist
      if (!roomState[roomId]) {
        roomState[roomId] = {
          code: "// Welcome!",
          stdin: "",
        };
      }

      const clients = getAllConnectedClients(io, roomId);
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
      roomState[roomId].code = code; // Store latest code
      socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
      io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // --- NEW COMPILER EVENTS ---

    socket.on(ACTIONS.RUN_CODE, async ({ roomId, language, code, stdin }) => {
      // Store the code, input, AND language
      roomState[roomId] = { code, stdin: stdin || "", language: language };

      io.to(roomId).emit(ACTIONS.CODE_RUNNING);
      const { output, error, waitingForInput } = await executeCode(
        language,
        code,
        roomState[roomId].stdin
      );

      // Emit to everyone in the room
      io.to(roomId).emit(ACTIONS.CODE_OUTPUT, {
        output,
        error,
        waitingForInput,
      });
    });

    socket.on(ACTIONS.PROVIDE_INPUT, async ({ roomId, input }) => {
      const currentRoom = roomState[roomId];
      if (!currentRoom) return;

      // Add new input to the accumulated input
      currentRoom.stdin += `${input}\n`;

      // Re-run the *original* code with the *new accumulated* input
      const { output, error, waitingForInput } = await executeCode(
        currentRoom.language,
        currentRoom.code,
        currentRoom.stdin
      );


      io.to(roomId).emit(ACTIONS.CODE_OUTPUT, {
        output,
        error,
        waitingForInput,
      });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, newLanguage }) => {
      // Broadcast to everyone else
      socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { newLanguage });
    });

    // --- ADD THIS LISTENER for Stdin ---
    socket.on(ACTIONS.STDIN_CHANGE, ({ roomId, newInput }) => {
      // Broadcast to everyone else
      socket.in(roomId).emit(ACTIONS.STDIN_CHANGE, { newInput });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];
      rooms.forEach((roomId) => {
        socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
      });

      // delete userSocketMap[socket.id];
      // You might also want to delete roomState[roomId] if no clients are left
      socket.leave();
    });
  });
}
