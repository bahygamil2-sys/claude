import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as adminBrandsService from "./adminBrands.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminBrandsService.list(req.query as never));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const brand = await adminBrandsService.getOne(req.params.id);
  res.status(200).json({ brand });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const brand = await adminBrandsService.updateStatus(req.params.id, req.body);
  res.status(200).json({ brand });
});
