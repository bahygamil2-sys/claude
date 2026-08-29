import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { brandUserContext } from "../../lib/authContext";
import * as reportsService from "./reports.service";

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await reportsService.getSummary(brandUserContext(req), req.params.id, req.query as never);
  res.status(200).json(summary);
});

export const getQuestionReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.getQuestionReport(brandUserContext(req), req.params.id, req.params.questionId, req.query as never);
  res.status(200).json(report);
});

export const getResponses = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportsService.getResponses(brandUserContext(req), req.params.id, req.query as never);
  res.status(200).json(result);
});

export const getResponseById = asyncHandler(async (req: Request, res: Response) => {
  const response = await reportsService.getResponseById(brandUserContext(req), req.params.id, req.params.responseId);
  res.status(200).json({ response });
});

export const exportResponses = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, contentType, extension } = await reportsService.exportResponses(brandUserContext(req), req.params.id, req.query as never);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="survey-responses.${extension}"`);
  res.status(200).send(buffer);
});
