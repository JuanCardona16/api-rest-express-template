import { Router } from "express";
import { UserController } from "../controller/user.controller";
import { ROUTES } from "@/constants";
import { authorize } from "@/modules/authentication/midlewares/auth.midleware";

const userRoutes = Router()
const userController = new UserController()

userRoutes.get(ROUTES.PRIVATE.USER, authorize, userController.getUserInfo)

export default userRoutes
