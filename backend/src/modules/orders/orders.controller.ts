import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as ordersService from "./orders.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.create(req.user!.id, req.body);
  res.status(201).json({ order });
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const result = await ordersService.listMine(req.user!.id, req.query as never);
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.getById(req.params.id, req.user!);
  res.status(200).json({ order });
});

export const getTracking = asyncHandler(async (req: Request, res: Response) => {
  const tracking = await ordersService.getTracking(req.params.id, req.user!);
  res.status(200).json(tracking);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.updateStatus(req.params.id, req.user!, req.body.status);
  res.status(200).json({ order });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.cancel(req.params.id, req.user!, req.body.reason);
  res.status(200).json({ order });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await ordersService.createReview(req.params.id, req.user!.id, req.body);
  res.status(201).json({ review });
});

export const getRestaurantOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await ordersService.restaurantOrders(req.params.id, req.user!, req.query as never);
  res.status(200).json(result);
});

export const getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await ordersService.adminOrders(req.query as never);
  res.status(200).json(result);
});
