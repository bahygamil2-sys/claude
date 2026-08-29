import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as menuService from "./menu.service";

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const menuCategories = await menuService.listCategories(req.params.id);
  res.status(200).json({ menuCategories });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const menuCategory = await menuService.createCategory(req.params.id, req.body);
  res.status(201).json({ menuCategory });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const menuCategory = await menuService.updateCategory(req.params.id, req.params.categoryId, req.body);
  res.status(200).json({ menuCategory });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await menuService.deleteCategory(req.params.id, req.params.categoryId);
  res.status(204).send();
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const menuItem = await menuService.createItem(req.params.id, req.body);
  res.status(201).json({ menuItem });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const menuItem = await menuService.updateItem(req.params.id, req.params.itemId, req.body);
  res.status(200).json({ menuItem });
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  await menuService.deleteItem(req.params.id, req.params.itemId);
  res.status(204).send();
});

export const setAvailability = asyncHandler(async (req: Request, res: Response) => {
  const menuItem = await menuService.setAvailability(req.params.id, req.params.itemId, req.body.isAvailable);
  res.status(200).json({ menuItem });
});
