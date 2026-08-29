import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { addressesRouter } from "../modules/addresses/addresses.routes";
import { categoriesRouter } from "../modules/categories/categories.routes";
import { restaurantsRouter } from "../modules/restaurants/restaurants.routes";
import { uploadsRouter } from "../modules/uploads/uploads.routes";
import { ordersRouter } from "../modules/orders/orders.routes";
import { adminRouter } from "../modules/admin/admin.routes";

export const v1Router = Router();

v1Router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "sufra-api", time: new Date().toISOString() });
});

v1Router.use("/auth", authRouter);
v1Router.use("/addresses", addressesRouter);
v1Router.use("/categories", categoriesRouter);
v1Router.use("/restaurants", restaurantsRouter);
v1Router.use("/uploads", uploadsRouter);
v1Router.use("/orders", ordersRouter);
v1Router.use("/admin", adminRouter);
