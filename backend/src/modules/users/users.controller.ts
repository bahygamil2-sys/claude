import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createUserSchema, updateUserSchema } from "./users.schema";
import * as usersService from "./users.service";

const idParamSchema = z.object({ id: z.string().min(1) });

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const users = await usersService.listUsers();
  res.status(200).json({ users });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createUserSchema.parse(req.body);
  const result = await usersService.createUser(input);
  res.status(201).json(result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateUserSchema.parse(req.body);
  const user = await usersService.updateUser(id, input);
  res.status(200).json({ user });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await usersService.resetPassword(id);
  res.status(200).json(result);
});
