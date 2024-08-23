import { ROUTES } from "@/constants";
import { validateSchema } from "@/helpers/schemas/validateSchema";
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { loginSchemaZod, registerSchameZod } from "../schemas/auth.schema";
import { asyncHandler } from "./../../../config/errors/asyncHandler";

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post(ROUTES.PUBLIC.REGISTER, validateSchema(registerSchameZod), asyncHandler(authController.register));
authRoutes.post(ROUTES.PUBLIC.LOGIN, validateSchema(loginSchemaZod), asyncHandler(authController.login));

export default authRoutes;
