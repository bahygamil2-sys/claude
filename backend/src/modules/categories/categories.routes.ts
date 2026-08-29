import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { categoryIdParamSchema, createCategorySchema, updateCategorySchema } from "./categories.schema";
import * as categoriesController from "./categories.controller";

export const categoriesRouter = Router();

categoriesRouter.get("/", categoriesController.list);

categoriesRouter.post(
  "/",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ body: createCategorySchema }),
  categoriesController.create
);
categoriesRouter.patch(
  "/:id",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  categoriesController.update
);
categoriesRouter.delete(
  "/:id",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ params: categoryIdParamSchema }),
  categoriesController.remove
);
