import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as addressesService from "./addresses.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressesService.listMine(req.user!.id);
  res.status(200).json({ addresses });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressesService.create(req.user!.id, req.body);
  res.status(201).json({ address });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressesService.update(req.user!.id, req.params.id, req.body);
  res.status(200).json({ address });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await addressesService.remove(req.user!.id, req.params.id);
  res.status(204).send();
});

export const setDefault = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressesService.setDefault(req.user!.id, req.params.id);
  res.status(200).json({ address });
});
