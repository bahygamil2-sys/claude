import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/authenticate";
import * as usersController from "./users.controller";

export const usersRouter = Router();

usersRouter.use(authenticate, requireRole("ADMIN"));

usersRouter.get("/", usersController.list);
usersRouter.post("/", usersController.create);
usersRouter.patch("/:id", usersController.update);
usersRouter.post("/:id/reset-password", usersController.resetPassword);
