import { z } from "zod";

export const surveyIdParamSchema = z.object({ id: z.string().uuid() });
export const questionIdParamSchema = z.object({ id: z.string().uuid(), questionId: z.string().uuid() });
export const responseIdParamSchema = z.object({ id: z.string().uuid(), responseId: z.string().uuid() });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const reportFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const paginatedResponsesQuerySchema = reportFiltersSchema.extend({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const exportQuerySchema = reportFiltersSchema.extend({
  format: z.enum(["csv", "xlsx"]).optional().default("csv"),
  lang: z.enum(["en", "ar"]).optional().default("en"),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;
export type PaginatedResponsesQuery = z.infer<typeof paginatedResponsesQuerySchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
