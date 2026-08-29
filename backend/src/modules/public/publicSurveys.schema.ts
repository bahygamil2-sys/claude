import { z } from "zod";

export const surveyTokenParamSchema = z.object({ token: z.string().min(1) });

export const submitResponseSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        value: z.unknown(),
      })
    )
    .min(1)
    .max(100),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
