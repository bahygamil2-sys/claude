import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireBrandRole, requireBrandUser } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import { updateBrandSchema } from "./brands.schema";
import * as brandsController from "./brands.controller";

export const brandsRouter = Router();

brandsRouter.use(authenticate, requireBrandUser);

brandsRouter.get("/", brandsController.getMine);
brandsRouter.patch("/", requireBrandRole("OWNER"), validate({ body: updateBrandSchema }), brandsController.updateMine);
