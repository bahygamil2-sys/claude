import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { loginLimiter } from "../../lib/rateLimit";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", loginLimiter, authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
authRouter.post("/change-password", authenticate, authController.changePassword);
