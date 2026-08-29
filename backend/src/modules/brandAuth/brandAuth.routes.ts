import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireBrandUser } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import { acceptInviteSchema, brandLoginSchema, brandSignupSchema } from "./brandAuth.schema";
import * as brandAuthController from "./brandAuth.controller";

export const brandAuthRouter = Router();

brandAuthRouter.post("/signup", validate({ body: brandSignupSchema }), brandAuthController.signup);
brandAuthRouter.post("/login", validate({ body: brandLoginSchema }), brandAuthController.login);
brandAuthRouter.post("/refresh", brandAuthController.refresh);
brandAuthRouter.post("/logout", brandAuthController.logout);
brandAuthRouter.post("/accept-invite", validate({ body: acceptInviteSchema }), brandAuthController.acceptInvite);
brandAuthRouter.get("/me", authenticate, requireBrandUser, brandAuthController.me);
