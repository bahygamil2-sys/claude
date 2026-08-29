import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { brandUserContext } from "../../lib/authContext";
import * as surveysService from "./surveys.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const surveys = await surveysService.list(brandUserContext(req));
  res.status(200).json({ surveys });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveysService.getOne(brandUserContext(req), req.params.id);
  res.status(200).json({ survey });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveysService.create(brandUserContext(req), req.body);
  res.status(201).json({ survey });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveysService.update(brandUserContext(req), req.params.id, req.body);
  res.status(200).json({ survey });
});

export const replaceQuestions = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveysService.replaceQuestions(brandUserContext(req), req.params.id, req.body);
  res.status(200).json({ survey });
});

export const publish = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveysService.publish(brandUserContext(req), req.params.id);
  res.status(200).json({ survey });
});

export const close = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveysService.close(brandUserContext(req), req.params.id);
  res.status(200).json({ survey });
});

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveysService.duplicate(brandUserContext(req), req.params.id);
  res.status(201).json({ survey });
});

export const getLinks = asyncHandler(async (req: Request, res: Response) => {
  const links = await surveysService.getOrCreateLinks(brandUserContext(req), req.params.id);
  res.status(200).json({ links });
});

export const regenerateLink = asyncHandler(async (req: Request, res: Response) => {
  const link = await surveysService.regenerateLink(brandUserContext(req), req.params.id, req.params.branchId);
  res.status(200).json({ link });
});
