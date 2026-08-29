import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as adminService from "./admin.service";
import * as ordersService from "../orders/orders.service";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminService.listUsers(req.query as never));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.updateUserStatus(req.params.id, req.body.isActive);
  res.status(200).json({ user });
});

export const listRestaurants = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminService.listRestaurants(req.query as never));
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await ordersService.adminOrders(req.query as never));
});
