import express from "express";
import {
  checkAuth,
  login,
  logout,
  registerUser,
  resetPassowrd,
  sendResetOtp,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { sendEmailLimiter } from "../middlewares/rateLimiter.js";

export const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

authRouter.get("/is-auth", isAuthenticated, checkAuth);

// Password Reset Flow (Kept active)
authRouter.post("/send-reset-otp", sendEmailLimiter, sendResetOtp);
authRouter.post("/reset-password", resetPassowrd);
