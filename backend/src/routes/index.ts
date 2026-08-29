import { Router } from "express";

export const v1Router = Router();

v1Router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "rai-api", time: new Date().toISOString() });
});

// Domain routers are mounted here as each module lands:
//   v1Router.use("/auth", authRouter);
//   v1Router.use("/admin", adminRouter);
//   v1Router.use("/brand", brandRouter);
//   v1Router.use("/public", publicRouter);
