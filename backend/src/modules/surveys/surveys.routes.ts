import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireBrandRole, requireBrandUser } from "../../middleware/authz";
import { validate } from "../../middleware/validate";
import {
  createSurveySchema,
  replaceQuestionsSchema,
  surveyBranchParamSchema,
  surveyIdParamSchema,
  updateSurveySchema,
} from "./surveys.schema";
import * as surveysController from "./surveys.controller";

export const surveysRouter = Router();

surveysRouter.use(authenticate, requireBrandUser);

surveysRouter.get("/", surveysController.list);
surveysRouter.post("/", requireBrandRole("OWNER"), validate({ body: createSurveySchema }), surveysController.create);

surveysRouter.get("/:id", validate({ params: surveyIdParamSchema }), surveysController.getOne);
surveysRouter.patch(
  "/:id",
  requireBrandRole("OWNER"),
  validate({ params: surveyIdParamSchema, body: updateSurveySchema }),
  surveysController.update
);

surveysRouter.put(
  "/:id/questions",
  requireBrandRole("OWNER"),
  validate({ params: surveyIdParamSchema, body: replaceQuestionsSchema }),
  surveysController.replaceQuestions
);

surveysRouter.post(
  "/:id/publish",
  requireBrandRole("OWNER"),
  validate({ params: surveyIdParamSchema }),
  surveysController.publish
);
surveysRouter.post("/:id/close", requireBrandRole("OWNER"), validate({ params: surveyIdParamSchema }), surveysController.close);
surveysRouter.post(
  "/:id/duplicate",
  requireBrandRole("OWNER"),
  validate({ params: surveyIdParamSchema }),
  surveysController.duplicate
);

surveysRouter.get("/:id/links", validate({ params: surveyIdParamSchema }), surveysController.getLinks);
surveysRouter.post(
  "/:id/links/:branchId/regenerate",
  requireBrandRole("OWNER"),
  validate({ params: surveyBranchParamSchema }),
  surveysController.regenerateLink
);
