import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getUserData } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/data", isAuthenticated, getUserData);

export default userRouter;
