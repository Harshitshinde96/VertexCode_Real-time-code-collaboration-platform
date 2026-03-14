import { Room } from "../models/roomModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ErrorHandler } from "../utils/ErrorHandler.js"; // Importing your error handler
import crypto from "crypto";

// --- Create a new room ---
export const createRoom = asyncHandler(async (req, res, next) => {
  // Generate a random 6-character string for the Room ID
  const roomId = crypto.randomBytes(3).toString("hex");
  const hostId = req.user?._id || req.user?.id || req.userId;

  if (!hostId) {
    return next(new ErrorHandler(401, "Unauthorized: User ID not found"));
  }

  // Mongoose automatically adds the default fileTree (/main.js)
  // and sets accessMode to "RESTRICTED" based on our schema.
  const room = await Room.create({
    roomId,
    host: hostId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, room, "Room created successfully"));
});

// --- Get room details ---
export const getRoom = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  // Fetch the room and populate host/guest data
  const room = await Room.findOne({ roomId })
    .populate("host", "name email")
    .populate("guests", "name email");

  if (!room) {
    return next(new ErrorHandler(404, "Room not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Room fetched successfully"));
});
