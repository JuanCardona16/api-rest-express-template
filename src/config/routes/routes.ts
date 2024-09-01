import { Router } from "express";
import authGoogleRouter from "@/modules/google-authentication/routes/authGoogle.route";
import authRoutes from "@/modules/authentication/routes/auth.route";

const router = Router();

router.use("/oauth", authGoogleRouter)
router.use("/auth", authRoutes);

export default router;
