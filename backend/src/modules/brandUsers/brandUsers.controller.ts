import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { brandUserContext } from "../../lib/authContext";
import * as brandUsersService from "./brandUsers.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const users = await brandUsersService.list(brandUserContext(req));
  res.status(200).json({ users });
});

export const invite = asyncHandler(async (req: Request, res: Response) => {
  const user = await brandUsersService.invite(brandUserContext(req), req.body);
  res.status(201).json({ user });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await brandUsersService.update(brandUserContext(req), req.params.id, req.body);
  res.status(200).json({ user });
});
