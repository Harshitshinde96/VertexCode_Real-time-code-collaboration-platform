import "./config/env.js"; // MUST be at the very top to load env vars early
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

// --- Auth & Database Imports ---
import dbConnect from "./config/db.js";
import { authRouter } from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

// --- Socket Import ---
import { initSocketHandler } from "./socketHandler.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./config/redis.js";

const app = express();

app.set("trust proxy", 1);

// --- Merged Express CORS (Crucial for Auth Cookies) ---
app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      process.env.CORS_ORIGIN ||
      "http://localhost:5173",
    credentials: true,
  }),
);

// --- Request Parsing Middlewares ---
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --- API Endpoints ---
app.get("/", (req, res) => {
  res.send("VertexCode Auth & Socket System Working");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);

// --- Global Error Middleware (MUST be after routes) ---
app.use(errorMiddleware);

// --- Setup HTTP Server and Socket.IO ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.CLIENT_URL ||
      process.env.CORS_ORIGIN ||
      "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true, // IMPORTANT: Allows sockets to receive the auth cookie
  },
});
// Tell Socket.io to use Redis for scaling!
io.adapter(createAdapter(pubClient, subClient));

// --- Initialize all socket logic ---
initSocketHandler(io);

const PORT = process.env.PORT || 5000;

// --- Connect to DB, THEN start the server ---
dbConnect()
  .then(() => {
    // ⚠️ IMPORTANT: We use server.listen here, NOT app.listen, so Socket.io works
    server.listen(PORT, () => {
      console.log(`⚙️  Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MONGO db connection failed !!! ", err);
  });
