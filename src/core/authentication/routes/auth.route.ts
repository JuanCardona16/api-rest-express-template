import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "./../../../config/errors/asyncHandler";

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post("/register", asyncHandler(authController.register));
authRoutes.post("/login", asyncHandler(authController.login));

export default authRoutes;
