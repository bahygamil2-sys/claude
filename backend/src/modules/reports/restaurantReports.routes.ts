import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as restaurantsService from "../restaurants/restaurants.service";
import {
  restaurantRangeOnlyQuerySchema,
  restaurantSalesOverTimeQuerySchema,
  restaurantSummaryQuerySchema,
  restaurantTopItemsQuerySchema,
} from "./reports.schema";
import * as restaurantReportsController from "./restaurantReports.controller";

// Mounted at /restaurants/:id/reports in restaurants.routes.ts (mergeParams so :id is visible here).
export const restaurantReportsRouter = Router({ mergeParams: true });

restaurantReportsRouter.use(
  authenticate,
  asyncHandler(async (req, _res, next) => {
    await restaurantsService.getOwnedOrThrow(req.params.id, req.user!);
    next();
  })
);

restaurantReportsRouter.get("/summary", validate({ query: restaurantSummaryQuerySchema }), restaurantReportsController.summary);
restaurantReportsRouter.get(
  "/sales-over-time",
  validate({ query: restaurantSalesOverTimeQuerySchema }),
  restaurantReportsController.salesOverTime
);
restaurantReportsRouter.get("/top-items", validate({ query: restaurantTopItemsQuerySchema }), restaurantReportsController.topItems);
restaurantReportsRouter.get(
  "/orders-by-status",
  validate({ query: restaurantRangeOnlyQuerySchema }),
  restaurantReportsController.ordersByStatus
);
restaurantReportsRouter.get(
  "/orders-by-hour",
  validate({ query: restaurantRangeOnlyQuerySchema }),
  restaurantReportsController.ordersByHour
);
