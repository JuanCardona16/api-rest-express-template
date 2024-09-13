import { Router } from "express";
import authGoogleRouter from "@/modules/google-authentication/routes/authGoogle.route";
import authRoutes from "@/modules/authentication/routes/auth.route";
import userRoutes from "@/modules/user/routes/user.routes";

const router = Router();

router.use("/oauth", authGoogleRouter)
router.use("/auth", authRoutes);
router.use("/user", userRoutes);

export default router;
