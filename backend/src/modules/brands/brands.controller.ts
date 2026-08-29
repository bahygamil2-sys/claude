import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { brandUserContext } from "../../lib/authContext";
import * as brandsService from "./brands.service";

export const getMine = asyncHandler(async (req: Request, res: Response) => {
  const brand = await brandsService.getOwnBrand(brandUserContext(req).brandId);
  res.status(200).json({ brand });
});

export const updateMine = asyncHandler(async (req: Request, res: Response) => {
  const brand = await brandsService.updateOwnBrand(brandUserContext(req).brandId, req.body);
  res.status(200).json({ brand });
});
