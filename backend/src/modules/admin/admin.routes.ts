import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { adminListRestaurantsQuerySchema, listUsersQuerySchema, updateUserStatusSchema, userIdParamSchema } from "./admin.schema";
import { adminOrdersQuerySchema } from "../orders/orders.schema";
import {
  adminLiveActivityQuerySchema,
  adminNewSignupsQuerySchema,
  adminOrdersByStatusQuerySchema,
  adminOverviewQuerySchema,
  adminSalesOverTimeQuerySchema,
  adminTopCategoriesQuerySchema,
  adminTopRestaurantsQuerySchema,
} from "../reports/reports.schema";
import * as adminController from "./admin.controller";
import * as adminReportsController from "../reports/adminReports.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(Role.ADMIN));

adminRouter.get("/users", validate({ query: listUsersQuerySchema }), adminController.listUsers);
adminRouter.patch(
  "/users/:id/status",
  validate({ params: userIdParamSchema, body: updateUserStatusSchema }),
  adminController.updateUserStatus
);

adminRouter.get("/restaurants", validate({ query: adminListRestaurantsQuerySchema }), adminController.listRestaurants);

adminRouter.get("/orders", validate({ query: adminOrdersQuerySchema }), adminController.listOrders);

adminRouter.get("/reports/overview", validate({ query: adminOverviewQuerySchema }), adminReportsController.overview);
adminRouter.get(
  "/reports/sales-over-time",
  validate({ query: adminSalesOverTimeQuerySchema }),
  adminReportsController.salesOverTime
);
adminRouter.get(
  "/reports/orders-by-status",
  validate({ query: adminOrdersByStatusQuerySchema }),
  adminReportsController.ordersByStatus
);
adminRouter.get(
  "/reports/top-restaurants",
  validate({ query: adminTopRestaurantsQuerySchema }),
  adminReportsController.topRestaurants
);
adminRouter.get(
  "/reports/top-categories",
  validate({ query: adminTopCategoriesQuerySchema }),
  adminReportsController.topCategories
);
adminRouter.get("/reports/new-signups", validate({ query: adminNewSignupsQuerySchema }), adminReportsController.newSignups);
adminRouter.get(
  "/reports/live-activity",
  validate({ query: adminLiveActivityQuerySchema }),
  adminReportsController.liveActivity
);
