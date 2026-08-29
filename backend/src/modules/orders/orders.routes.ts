import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import {
  cancelOrderSchema,
  createOrderSchema,
  createReviewSchema,
  listMyOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from "./orders.schema";
import * as ordersController from "./orders.controller";

export const ordersRouter = Router();

ordersRouter.use(authenticate);

ordersRouter.post("/", requireRole(Role.CUSTOMER), validate({ body: createOrderSchema }), ordersController.create);
ordersRouter.get("/", requireRole(Role.CUSTOMER), validate({ query: listMyOrdersQuerySchema }), ordersController.listMine);
ordersRouter.get("/:id", validate({ params: orderIdParamSchema }), ordersController.getById);
ordersRouter.get("/:id/tracking", validate({ params: orderIdParamSchema }), ordersController.getTracking);
ordersRouter.patch(
  "/:id/status",
  requireRole(Role.RESTAURANT_OWNER, Role.ADMIN),
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  ordersController.updateStatus
);
ordersRouter.patch(
  "/:id/cancel",
  validate({ params: orderIdParamSchema, body: cancelOrderSchema }),
  ordersController.cancel
);
ordersRouter.post(
  "/:id/review",
  requireRole(Role.CUSTOMER),
  validate({ params: orderIdParamSchema, body: createReviewSchema }),
  ordersController.createReview
);
