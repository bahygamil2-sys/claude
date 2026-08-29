import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireBrandRole } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import { brandUserIdParamSchema, inviteBrandUserSchema, updateBrandUserSchema } from "./brandUsers.schema";
import * as brandUsersController from "./brandUsers.controller";

export const brandUsersRouter = Router();

// The whole module is Owner-only — team management is a centralized activity.
brandUsersRouter.use(authenticate, requireBrandRole("OWNER"));

brandUsersRouter.get("/", brandUsersController.list);
brandUsersRouter.post("/", validate({ body: inviteBrandUserSchema }), brandUsersController.invite);
brandUsersRouter.patch(
  "/:id",
  validate({ params: brandUserIdParamSchema, body: updateBrandUserSchema }),
  brandUsersController.update
);
