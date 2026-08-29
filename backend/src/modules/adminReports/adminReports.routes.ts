import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/authz";
import * as adminReportsController from "./adminReports.controller";

export const adminReportsRouter = Router();

adminReportsRouter.use(authenticate, requireAdmin);
adminReportsRouter.get("/stats", adminReportsController.getStats);
