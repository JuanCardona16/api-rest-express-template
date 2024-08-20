import { Router } from "express";
import authRoutes from "@/core/authentication/routes/auth.route.ts";

const router = Router();

router.use("/auth", authRoutes);

export default router;
