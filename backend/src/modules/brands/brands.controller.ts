import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createBrandSchema, updateBrandSchema } from "./brands.schema";
import * as brandsService from "./brands.service";

const idParamSchema = z.object({ id: z.string().min(1) });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const brands = await brandsService.listBrands(req.user!);
  res.status(200).json({ brands });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const brand = await brandsService.getBrand(req.user!, id);
  res.status(200).json({ brand });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createBrandSchema.parse(req.body);
  const brand = await brandsService.createBrand(input);
  res.status(201).json({ brand });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateBrandSchema.parse(req.body);
  const brand = await brandsService.updateBrand(id, input);
  res.status(200).json({ brand });
});
