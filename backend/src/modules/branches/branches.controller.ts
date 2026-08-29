import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { brandUserContext } from "../../lib/authContext";
import * as branchesService from "./branches.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const branches = await branchesService.list(brandUserContext(req));
  res.status(200).json({ branches });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const branch = await branchesService.getOne(brandUserContext(req), req.params.id);
  res.status(200).json({ branch });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const branch = await branchesService.create(brandUserContext(req), req.body);
  res.status(201).json({ branch });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const branch = await branchesService.update(brandUserContext(req), req.params.id, req.body);
  res.status(200).json({ branch });
});
