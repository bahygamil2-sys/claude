import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as publicSurveysService from "./publicSurveys.service";

export const getSurvey = asyncHandler(async (req: Request, res: Response) => {
  const survey = await publicSurveysService.getPublicSurvey(req.params.token);
  res.status(200).json(survey);
});

export const submitResponse = asyncHandler(async (req: Request, res: Response) => {
  const result = await publicSurveysService.submitResponse(req.params.token, req.ip, req.get("user-agent"), req.body);
  res.status(201).json(result);
});
