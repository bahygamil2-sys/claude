import { Router } from "express";
import { validate } from "../../middleware/validate";
import { publicFetchLimiter, publicSubmitLimiter } from "../../lib/rateLimit";
import { submitResponseSchema, surveyTokenParamSchema } from "./publicSurveys.schema";
import * as publicSurveysController from "./publicSurveys.controller";

// No authenticate()/requireBrandUser() anywhere in this router — the entire
// point of this module is that it is reachable by anyone on the internet.
export const publicSurveysRouter = Router();

publicSurveysRouter.get(
  "/surveys/:token",
  publicFetchLimiter,
  validate({ params: surveyTokenParamSchema }),
  publicSurveysController.getSurvey
);

publicSurveysRouter.post(
  "/surveys/:token/responses",
  publicSubmitLimiter,
  validate({ params: surveyTokenParamSchema, body: submitResponseSchema }),
  publicSurveysController.submitResponse
);
