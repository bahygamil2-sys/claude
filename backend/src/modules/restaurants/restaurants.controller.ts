import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as restaurantsService from "./restaurants.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await restaurantsService.listPublic(req.query as never);
  res.status(200).json(result);
});

export const getMine = asyncHandler(async (req: Request, res: Response) => {
  const restaurants = await restaurantsService.getMine(req.user!.id);
  res.status(200).json({ restaurants });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantsService.getByIdOrSlug(req.params.idOrSlug);
  res.status(200).json({ restaurant });
});

export const getMenu = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantsService.getByIdOrSlug(req.params.idOrSlug);
  const menu = await restaurantsService.getMenu(restaurant.id);
  res.status(200).json(menu);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantsService.create(req.user!.id, req.body);
  res.status(201).json({ restaurant });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantsService.update(req.params.id, req.user!, req.body);
  res.status(200).json({ restaurant });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantsService.updateStatus(req.params.id, req.body);
  res.status(200).json({ restaurant });
});
