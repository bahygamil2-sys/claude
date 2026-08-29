import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as adminReportsService from "./adminReports.service";

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(await adminReportsService.getStats());
});
