import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as categoriesService from "./categories.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesService.listAll();
  res.status(200).json({ categories });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.create(req.body);
  res.status(201).json({ category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.update(req.params.id, req.body);
  res.status(200).json({ category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await categoriesService.remove(req.params.id);
  res.status(204).send();
});
