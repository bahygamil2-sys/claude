import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import { brandIdParamSchema, listBrandsQuerySchema, updateBrandStatusSchema } from "./adminBrands.schema";
import * as adminBrandsController from "./adminBrands.controller";

export const adminBrandsRouter = Router();

adminBrandsRouter.use(authenticate, requireAdmin);

adminBrandsRouter.get("/", validate({ query: listBrandsQuerySchema }), adminBrandsController.list);
adminBrandsRouter.get("/:id", validate({ params: brandIdParamSchema }), adminBrandsController.getOne);
adminBrandsRouter.patch(
  "/:id/status",
  validate({ params: brandIdParamSchema, body: updateBrandStatusSchema }),
  adminBrandsController.updateStatus
);
