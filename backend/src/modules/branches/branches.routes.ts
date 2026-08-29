import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireBrandRole, requireBrandUser } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import { branchIdParamSchema, createBranchSchema, updateBranchSchema } from "./branches.schema";
import * as branchesController from "./branches.controller";

export const branchesRouter = Router();

branchesRouter.use(authenticate, requireBrandUser);

branchesRouter.get("/", branchesController.list);
branchesRouter.post("/", requireBrandRole("OWNER"), validate({ body: createBranchSchema }), branchesController.create);
branchesRouter.get("/:id", validate({ params: branchIdParamSchema }), branchesController.getOne);
branchesRouter.patch(
  "/:id",
  requireBrandRole("OWNER"),
  validate({ params: branchIdParamSchema, body: updateBranchSchema }),
  branchesController.update
);
