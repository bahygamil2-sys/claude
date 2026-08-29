import { z } from "zod";
import { QuestionType } from "@prisma/client";

export const ALL_QUESTION_TYPES: QuestionType[] = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "DROPDOWN",
  "RATING",
  "NPS",
  "YES_NO",
  "DATE",
];

const OPTION_TYPES: QuestionType[] = ["SINGLE_CHOICE", "MULTI_CHOICE", "DROPDOWN"];

export function questionNeedsOptions(type: QuestionType): boolean {
  return OPTION_TYPES.includes(type);
}

// Type-specific settings stored on Question.config — read-and-rendered only,
// never filtered/queried on, so a small per-type zod schema at the
// application layer is the right amount of structure (see schema.prisma).
const emptyConfig = z.object({}).strict();
const multiChoiceConfig = z.object({ maxSelections: z.number().int().positive().optional() }).strict();
const ratingConfig = z
  .object({
    max: z.number().int().min(3).max(10).default(5),
    inputStyle: z.enum(["stars", "slider", "numeric"]).default("stars"),
  })
  .strict();

export function questionConfigSchema(type: QuestionType) {
  switch (type) {
    case "MULTI_CHOICE":
      return multiChoiceConfig;
    case "RATING":
      return ratingConfig;
    default:
      return emptyConfig;
  }
}

/**
 * Answer.value shape per type — a shared contract used both by the survey
 * builder (nothing validates against this directly today, but it's the
 * single source of truth question-rendering code on the frontend follows)
 * and, critically, by the public response-submission endpoint (Phase 5),
 * so a submitted answer can never be a shape the question type doesn't
 * allow. `optionIds` is the set of valid option ids for choice-type
 * questions — pass the question's actual options so a stray/foreign id is
 * rejected rather than silently accepted.
 */
export function answerValueSchema(type: QuestionType, optionIds: string[] = [], ratingMax = 5) {
  switch (type) {
    case "SHORT_TEXT":
      return z.object({ text: z.string().trim().min(1).max(500) });
    case "LONG_TEXT":
      return z.object({ text: z.string().trim().min(1).max(5000) });
    case "SINGLE_CHOICE":
    case "DROPDOWN":
      return z.object({ optionId: z.string().refine((id) => optionIds.includes(id), "Unknown option") });
    case "MULTI_CHOICE":
      return z.object({
        optionIds: z
          .array(z.string().refine((id) => optionIds.includes(id), "Unknown option"))
          .min(1)
          .max(optionIds.length || 50),
      });
    case "RATING":
      return z.object({ rating: z.number().int().min(1).max(ratingMax) });
    case "NPS":
      return z.object({ nps: z.number().int().min(0).max(10) });
    case "YES_NO":
      return z.object({ boolean: z.boolean() });
    case "DATE":
      return z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD") });
  }
}
