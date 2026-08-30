import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { usersRouter } from "../modules/users/users.routes";

export const v1Router = Router();

v1Router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "branch-sales-dashboard-api", time: new Date().toISOString() });
});

v1Router.use("/auth", authRouter);
v1Router.use("/users", usersRouter);
