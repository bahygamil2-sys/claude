import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { menuRouter } from "../menu/menu.routes";
import { reviewsRouter } from "../reviews/reviews.routes";
import { restaurantReportsRouter } from "../reports/restaurantReports.routes";
import * as ordersController from "../orders/orders.controller";
import { restaurantOrdersQuerySchema } from "../orders/orders.schema";
import {
  createRestaurantSchema,
  listRestaurantsQuerySchema,
  restaurantIdOrSlugParamSchema,
  restaurantIdParamSchema,
  updateRestaurantSchema,
  updateRestaurantStatusSchema,
} from "./restaurants.schema";
import * as restaurantsController from "./restaurants.controller";

export const restaurantsRouter = Router();

restaurantsRouter.get("/", validate({ query: listRestaurantsQuerySchema }), restaurantsController.list);

// Static routes before the /:idOrSlug catch-all.
restaurantsRouter.get("/mine", authenticate, requireRole(Role.RESTAURANT_OWNER, Role.ADMIN), restaurantsController.getMine);
restaurantsRouter.post(
  "/",
  authenticate,
  requireRole(Role.RESTAURANT_OWNER),
  validate({ body: createRestaurantSchema }),
  restaurantsController.create
);

restaurantsRouter.get("/:idOrSlug", validate({ params: restaurantIdOrSlugParamSchema }), restaurantsController.getOne);
restaurantsRouter.get("/:idOrSlug/menu", validate({ params: restaurantIdOrSlugParamSchema }), restaurantsController.getMenu);

restaurantsRouter.patch(
  "/:id",
  authenticate,
  requireRole(Role.RESTAURANT_OWNER, Role.ADMIN),
  validate({ params: restaurantIdParamSchema, body: updateRestaurantSchema }),
  restaurantsController.update
);
restaurantsRouter.patch(
  "/:id/status",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ params: restaurantIdParamSchema, body: updateRestaurantStatusSchema }),
  restaurantsController.updateStatus
);

restaurantsRouter.get(
  "/:id/orders",
  authenticate,
  requireRole(Role.RESTAURANT_OWNER, Role.ADMIN),
  validate({ params: restaurantIdParamSchema, query: restaurantOrdersQuerySchema }),
  ordersController.getRestaurantOrders
);

restaurantsRouter.use("/:id", menuRouter);
restaurantsRouter.use("/:id/reviews", reviewsRouter);
restaurantsRouter.use("/:id/reports", restaurantReportsRouter);
