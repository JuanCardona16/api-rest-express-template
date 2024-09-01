import { Router } from "express";
import {
  redirectToGoogleAuth,
  handleGoogleCallback,
} from "../controllers/authGoogle.controller";

const authGoogleRouter = Router();

authGoogleRouter.get("/google", redirectToGoogleAuth);
authGoogleRouter.get("/google/callback", handleGoogleCallback);

export default authGoogleRouter;
