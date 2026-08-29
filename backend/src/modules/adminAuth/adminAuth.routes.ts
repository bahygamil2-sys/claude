import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import { adminLoginSchema } from "./adminAuth.schema";
import * as adminAuthController from "./adminAuth.controller";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", validate({ body: adminLoginSchema }), adminAuthController.login);
adminAuthRouter.post("/refresh", adminAuthController.refresh);
adminAuthRouter.post("/logout", adminAuthController.logout);
adminAuthRouter.get("/me", authenticate, requireAdmin, adminAuthController.me);
