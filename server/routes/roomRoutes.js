import express from "express";
import { createRoom, getRoom } from "../controllers/roomController.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const roomRouter = express.Router();

// Apply isAuthenticated middleware directly to the routes
roomRouter.post("/create", isAuthenticated, createRoom);
roomRouter.get("/:roomId", isAuthenticated, getRoom);

export default roomRouter;
