import { z } from "zod";
import { QuestionType } from "@prisma/client";
import { questionConfigSchema, questionNeedsOptions } from "../../lib/questionTypes";

export const surveyIdParamSchema = z.object({ id: z.string().uuid() });
export const surveyBranchParamSchema = z.object({ id: z.string().uuid(), branchId: z.string().uuid() });

const scopeType = z.enum(["ALL_BRANCHES", "SPECIFIC_BRANCHES"]);

export const createSurveySchema = z.object({
  title: z.string().trim().min(2).max(200),
  titleAr: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  descriptionAr: z.string().trim().max(2000).optional(),
  thankYouMessage: z.string().trim().max(500).optional(),
  thankYouMessageAr: z.string().trim().max(500).optional(),
  scopeType: scopeType.default("ALL_BRANCHES"),
  branchIds: z.array(z.string().uuid()).optional(),
});

export const updateSurveySchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  titleAr: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  descriptionAr: z.string().trim().max(2000).optional(),
  thankYouMessage: z.string().trim().max(500).optional(),
  thankYouMessageAr: z.string().trim().max(500).optional(),
  scopeType: scopeType.optional(),
  branchIds: z.array(z.string().uuid()).optional(),
});

const questionOptionInput = z.object({
  label: z.string().trim().min(1).max(200),
  labelAr: z.string().trim().min(1).max(200),
});

const questionInput = z
  .object({
    type: z.nativeEnum(QuestionType),
    label: z.string().trim().min(1).max(300),
    labelAr: z.string().trim().min(1).max(300),
    helpText: z.string().trim().max(500).optional(),
    helpTextAr: z.string().trim().max(500).optional(),
    isRequired: z.boolean().default(true),
    config: z.record(z.unknown()).default({}),
    options: z.array(questionOptionInput).default([]),
  })
  .superRefine((question, ctx) => {
    const configResult = questionConfigSchema(question.type).safeParse(question.config);
    if (!configResult.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid config for question type ${question.type}`, path: ["config"] });
    }

    if (questionNeedsOptions(question.type)) {
      if (question.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 2 options are required for this question type",
          path: ["options"],
        });
      }
    } else if (question.options.length > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This question type does not accept options", path: ["options"] });
    }
  });

export const replaceQuestionsSchema = z.object({
  questions: z.array(questionInput).min(1).max(50),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;
export type ReplaceQuestionsInput = z.infer<typeof replaceQuestionsSchema>;
