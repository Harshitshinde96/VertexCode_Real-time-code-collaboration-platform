import userModel from "../models/userModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

export const getUserData = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const user = await userModel.findById(userId);

  if (!user) {
    return next(new ErrorHandler(404, "User not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User Data Fetched Successfully"));
});
