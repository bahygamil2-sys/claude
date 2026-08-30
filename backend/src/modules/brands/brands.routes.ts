import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/authenticate";
import * as brandsController from "./brands.controller";

export const brandsRouter = Router();

brandsRouter.use(authenticate);

brandsRouter.get("/", brandsController.list);
brandsRouter.get("/:id", brandsController.get);
brandsRouter.post("/", requireRole("ADMIN"), brandsController.create);
brandsRouter.patch("/:id", requireRole("ADMIN"), brandsController.update);
