import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireBrandUser } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import {
  exportQuerySchema,
  paginatedResponsesQuerySchema,
  questionIdParamSchema,
  reportFiltersSchema,
  responseIdParamSchema,
  surveyIdParamSchema,
} from "./reports.schema";
import * as reportsController from "./reports.controller";

// Mounted at the same "/surveys" prefix as surveysRouter — Express falls
// through to here for the nested .../report/* paths that surveysRouter's
// own routes (which only match a single :id segment) never match.
export const reportsRouter = Router();

reportsRouter.use(authenticate, requireBrandUser);

reportsRouter.get(
  "/:id/report/summary",
  validate({ params: surveyIdParamSchema, query: reportFiltersSchema }),
  reportsController.getSummary
);
reportsRouter.get(
  "/:id/report/questions/:questionId",
  validate({ params: questionIdParamSchema, query: reportFiltersSchema }),
  reportsController.getQuestionReport
);
reportsRouter.get(
  "/:id/report/responses",
  validate({ params: surveyIdParamSchema, query: paginatedResponsesQuerySchema }),
  reportsController.getResponses
);
reportsRouter.get(
  "/:id/report/responses/:responseId",
  validate({ params: responseIdParamSchema }),
  reportsController.getResponseById
);
reportsRouter.get(
  "/:id/report/export",
  validate({ params: surveyIdParamSchema, query: exportQuerySchema }),
  reportsController.exportResponses
);
