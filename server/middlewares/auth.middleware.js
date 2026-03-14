import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Middleware to check if the user is logged in
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  // 1. Get token from cookies
  const { token } = req.cookies;

  if (!token) {
    return res.json({
      success: false,
      message: "Not Authorized. Login Again.",
    });
  }
  try {
    // 2. Verify the token using your secret key
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user in the database and attach to the request object
    req.user = await userModel.findById(decodedData.id);

    if (!req.user) {
      return next(new ErrorHandler(404, "User not found with this token"));
    }

    next(); // Move to the actual controller
  } catch {
    return next(
      new ErrorHandler(401, "Invalid or expired token. Please login again."),
    );
  }
});
