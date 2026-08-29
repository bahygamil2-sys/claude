import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as restaurantReportsService from "./restaurantReports.service";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await restaurantReportsService.summary(req.params.id, req.query as never));
});

export const salesOverTime = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await restaurantReportsService.salesOverTime(req.params.id, req.query as never));
});

export const topItems = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await restaurantReportsService.topItems(req.params.id, req.query as never));
});

export const ordersByStatus = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await restaurantReportsService.ordersByStatus(req.params.id, req.query as never));
});

export const ordersByHour = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await restaurantReportsService.ordersByHour(req.params.id, req.query as never));
});
