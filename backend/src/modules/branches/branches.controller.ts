import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";
import { addAliasSchema, createBranchSchema, listBranchesQuerySchema, updateBranchSchema } from "./branches.schema";
import * as branchesService from "./branches.service";

const idParamSchema = z.object({ id: z.string().min(1) });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = listBranchesQuerySchema.parse(req.query);
  const branches = await branchesService.listBranches(req.user!, query);
  res.status(200).json({ branches });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createBranchSchema.parse(req.body);
  const branch = await branchesService.createBranch(req.user!, input);
  res.status(201).json({ branch });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateBranchSchema.parse(req.body);
  const branch = await branchesService.updateBranch(req.user!, id, input);
  res.status(200).json({ branch });
});

export const listAliases = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const aliases = await branchesService.listAliases(req.user!, id);
  res.status(200).json({ aliases });
});

export const addAlias = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = addAliasSchema.parse(req.body);
  const alias = await branchesService.addAlias(req.user!, id, input);
  res.status(201).json({ alias });
});
