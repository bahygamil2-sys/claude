import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as adminReportsService from "./adminReports.service";

export const overview = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminReportsService.overview(req.query as never));
});

export const salesOverTime = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminReportsService.salesOverTime(req.query as never));
});

export const ordersByStatus = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminReportsService.ordersByStatus(req.query as never));
});

export const topRestaurants = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminReportsService.topRestaurants(req.query as never));
});

export const topCategories = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminReportsService.topCategories(req.query as never));
});

export const newSignups = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminReportsService.newSignups(req.query as never));
});

export const liveActivity = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = req.query as never as { limit: number };
  res.status(200).json(await adminReportsService.liveActivity(limit));
});
