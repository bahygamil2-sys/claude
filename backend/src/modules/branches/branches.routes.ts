import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/authenticate";
import * as branchesController from "./branches.controller";

export const branchesRouter = Router();

branchesRouter.use(authenticate);

branchesRouter.get("/", branchesController.list);
branchesRouter.post("/", requireRole("ADMIN", "EDITOR"), branchesController.create);
branchesRouter.patch("/:id", requireRole("ADMIN", "EDITOR"), branchesController.update);
branchesRouter.get("/:id/aliases", branchesController.listAliases);
branchesRouter.post("/:id/aliases", requireRole("ADMIN", "EDITOR"), branchesController.addAlias);
