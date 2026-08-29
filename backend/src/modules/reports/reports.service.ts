import { Prisma } from "@prisma/client";
import type { Question } from "@prisma/client";
import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { assertBranchAccess, getAccessibleBranchIds } from "../../lib/branchAccess";
import { bucketByDay } from "../../lib/dateBuckets";
import type { BrandAccessTokenPayload } from "../../lib/tokens";
import type { ExportQuery, PaginatedResponsesQuery, ReportFilters } from "./reports.schema";

async function getOwnedSurvey(brandId: string, id: string) {
  const survey = await prisma.survey.findFirst({ where: { id, brandId } });
  if (!survey) throw ApiError.notFound("Survey not found");
  return survey;
}

/** Every reporting query goes through this: an explicit branchId is checked against the caller's
 * access, and with none given a Manager is silently narrowed to their accessible branches — the
 * "server-intersected" rule applies uniformly across summary/question/response/export. */
async function resolveResponseWhere(
  user: BrandAccessTokenPayload,
  surveyId: string,
  filters: ReportFilters
): Promise<Prisma.ResponseWhereInput> {
  const where: Prisma.ResponseWhereInput = { surveyId };

  if (filters.branchId) {
    await assertBranchAccess(user, filters.branchId);
    where.branchId = filters.branchId;
  } else {
    const accessibleIds = await getAccessibleBranchIds(user);
    if (accessibleIds) where.branchId = { in: accessibleIds };
  }

  if (filters.from || filters.to) {
    where.submittedAt = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }

  return where;
}

export async function getSummary(user: BrandAccessTokenPayload, surveyId: string, filters: ReportFilters) {
  await getOwnedSurvey(user.brandId, surveyId);
  const responseWhere = await resolveResponseWhere(user, surveyId, filters);

  const [totalResponses, byBranchRaw, questions, submittedAts, answerCounts] = await Promise.all([
    prisma.response.count({ where: responseWhere }),
    prisma.response.groupBy({ by: ["branchId"], where: responseWhere, _count: { _all: true } }),
    prisma.question.findMany({ where: { surveyId }, orderBy: { sortOrder: "asc" } }),
    prisma.response.findMany({ where: responseWhere, select: { submittedAt: true } }),
    prisma.answer.groupBy({ by: ["questionId"], where: { response: responseWhere }, _count: { _all: true } }),
  ]);

  const branches = await prisma.restaurantBranch.findMany({ where: { id: { in: byBranchRaw.map((b) => b.branchId) } } });
  const branchById = new Map(branches.map((b) => [b.id, b]));
  const responsesByBranch = byBranchRaw
    .map((row) => {
      const branch = branchById.get(row.branchId);
      return branch ? { branchId: branch.id, branchName: branch.name, branchNameAr: branch.nameAr, count: row._count._all } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.count - a.count);

  const countByQuestionId = new Map(answerCounts.map((row) => [row.questionId, row._count._all]));
  const questionSummaries = questions.map((question) => ({
    questionId: question.id,
    type: question.type,
    label: question.label,
    labelAr: question.labelAr,
    responseCount: countByQuestionId.get(question.id) ?? 0,
  }));

  return {
    totalResponses,
    responsesByBranch,
    responsesOverTime: bucketByDay(submittedAts.map((r) => r.submittedAt)),
    questionSummaries,
  };
}

export async function getQuestionReport(user: BrandAccessTokenPayload, surveyId: string, questionId: string, filters: ReportFilters) {
  await getOwnedSurvey(user.brandId, surveyId);
  const question = await prisma.question.findFirst({
    where: { id: questionId, surveyId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  if (!question) throw ApiError.notFound("Question not found");

  const responseWhere = await resolveResponseWhere(user, surveyId, filters);
  const answers = await prisma.answer.findMany({
    where: { questionId, response: responseWhere },
    select: { value: true, optionId: true },
  });

  const base = {
    questionId: question.id,
    type: question.type,
    label: question.label,
    labelAr: question.labelAr,
    responseCount: answers.length,
  };
  const percentage = (count: number) => (answers.length ? Math.round((count / answers.length) * 1000) / 10 : 0);

  switch (question.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT": {
      const samples = answers
        .map((a) => (a.value as { text?: string } | null)?.text)
        .filter((text): text is string => Boolean(text))
        .slice(0, 200);
      return { ...base, samples };
    }
    case "SINGLE_CHOICE":
    case "DROPDOWN": {
      const counts = new Map<string, number>();
      for (const answer of answers) if (answer.optionId) counts.set(answer.optionId, (counts.get(answer.optionId) ?? 0) + 1);
      const distribution = question.options.map((option) => ({
        optionId: option.id,
        label: option.label,
        labelAr: option.labelAr,
        count: counts.get(option.id) ?? 0,
        percentage: percentage(counts.get(option.id) ?? 0),
      }));
      return { ...base, distribution };
    }
    case "MULTI_CHOICE": {
      const counts = new Map<string, number>();
      for (const answer of answers) {
        const optionIds = (answer.value as { optionIds?: string[] } | null)?.optionIds ?? [];
        for (const optionId of optionIds) counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
      }
      const distribution = question.options.map((option) => ({
        optionId: option.id,
        label: option.label,
        labelAr: option.labelAr,
        count: counts.get(option.id) ?? 0,
        percentage: percentage(counts.get(option.id) ?? 0),
      }));
      return { ...base, distribution };
    }
    case "RATING": {
      const max = (question.config as { max?: number } | null)?.max ?? 5;
      const values = answers
        .map((a) => (a.value as { rating?: number } | null)?.rating)
        .filter((v): v is number => typeof v === "number");
      const histogram = Array.from({ length: max }, (_, i) => i + 1).map((value) => ({
        value,
        count: values.filter((v) => v === value).length,
      }));
      const average = values.length ? Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100 : 0;
      return { ...base, average, max, histogram };
    }
    case "NPS": {
      const values = answers.map((a) => (a.value as { nps?: number } | null)?.nps).filter((v): v is number => typeof v === "number");
      const promoters = values.filter((v) => v >= 9).length;
      const passives = values.filter((v) => v >= 7 && v <= 8).length;
      const detractors = values.filter((v) => v <= 6).length;
      const average = values.length ? Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100 : 0;
      const score = values.length ? Math.round(((promoters - detractors) / values.length) * 100) : 0;
      return { ...base, average, score, promoters, passives, detractors };
    }
    case "YES_NO": {
      const values = answers.map((a) => (a.value as { boolean?: boolean } | null)?.boolean);
      const yes = values.filter((v) => v === true).length;
      const no = values.filter((v) => v === false).length;
      return { ...base, yes, no, yesPercentage: percentage(yes), noPercentage: percentage(no) };
    }
    case "DATE": {
      const counts = new Map<string, number>();
      for (const answer of answers) {
        const date = (answer.value as { date?: string } | null)?.date;
        if (date) counts.set(date, (counts.get(date) ?? 0) + 1);
      }
      const distribution = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
      return { ...base, distribution };
    }
  }
}

type ResponseWithAnswers = Prisma.ResponseGetPayload<{ include: { answers: { include: { question: true; option: true } } } }>;

function toResponseDto(response: ResponseWithAnswers, branchById: Map<string, { name: string; nameAr: string }>) {
  const branch = branchById.get(response.branchId);
  return {
    id: response.id,
    branchId: response.branchId,
    branchName: branch?.name ?? null,
    branchNameAr: branch?.nameAr ?? null,
    submittedAt: response.submittedAt,
    answers: response.answers.map((answer) => ({
      questionId: answer.questionId,
      type: answer.question.type,
      label: answer.question.label,
      labelAr: answer.question.labelAr,
      value: answer.value,
      optionLabel: answer.option?.label ?? null,
      optionLabelAr: answer.option?.labelAr ?? null,
    })),
  };
}

export async function getResponses(user: BrandAccessTokenPayload, surveyId: string, query: PaginatedResponsesQuery) {
  await getOwnedSurvey(user.brandId, surveyId);
  const where = await resolveResponseWhere(user, surveyId, query);
  const accessibleIds = await getAccessibleBranchIds(user);

  const [items, total, branches] = await Promise.all([
    prisma.response.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { answers: { include: { question: true, option: true } } },
    }),
    prisma.response.count({ where }),
    prisma.restaurantBranch.findMany({
      where: { brandId: user.brandId, ...(accessibleIds ? { id: { in: accessibleIds } } : {}) },
    }),
  ]);

  const branchById = new Map(branches.map((b) => [b.id, b]));

  return {
    items: items.map((response) => toResponseDto(response, branchById)),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getResponseById(user: BrandAccessTokenPayload, surveyId: string, responseId: string) {
  await getOwnedSurvey(user.brandId, surveyId);
  const response = await prisma.response.findFirst({
    where: { id: responseId, surveyId },
    include: { answers: { include: { question: true, option: true } } },
  });
  if (!response) throw ApiError.notFound("Response not found");
  await assertBranchAccess(user, response.branchId);

  const branch = await prisma.restaurantBranch.findUnique({ where: { id: response.branchId } });
  return toResponseDto(response, new Map(branch ? [[branch.id, branch]] : []));
}

function formatAnswerForExport(
  question: Question,
  value: Prisma.JsonValue | undefined,
  optionLabelById: Map<string, string>,
  useArabic: boolean
): string {
  if (value === undefined || value === null) return "";
  const v = value as Record<string, unknown>;
  switch (question.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      return typeof v.text === "string" ? v.text : "";
    case "SINGLE_CHOICE":
    case "DROPDOWN":
      return typeof v.optionId === "string" ? (optionLabelById.get(v.optionId) ?? "") : "";
    case "MULTI_CHOICE":
      return Array.isArray(v.optionIds) ? (v.optionIds as string[]).map((id) => optionLabelById.get(id) ?? "").join("; ") : "";
    case "RATING":
      return typeof v.rating === "number" ? String(v.rating) : "";
    case "NPS":
      return typeof v.nps === "number" ? String(v.nps) : "";
    case "YES_NO":
      return typeof v.boolean === "boolean" ? (v.boolean ? (useArabic ? "نعم" : "Yes") : useArabic ? "لا" : "No") : "";
    case "DATE":
      return typeof v.date === "string" ? v.date : "";
  }
}

function buildCsv(headers: string[], rows: string[][]): string {
  const escape = (cell: string) => (/[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

async function buildXlsx(sheetTitle: string, headers: string[], rows: string[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const safeTitle = sheetTitle.replace(/[*?:\\/[\]]/g, "").slice(0, 31) || "Responses";
  const sheet = workbook.addWorksheet(safeTitle);
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportResponses(user: BrandAccessTokenPayload, surveyId: string, query: ExportQuery) {
  const survey = await getOwnedSurvey(user.brandId, surveyId);
  const where = await resolveResponseWhere(user, surveyId, query);

  const [questions, responses] = await Promise.all([
    prisma.question.findMany({ where: { surveyId }, orderBy: { sortOrder: "asc" }, include: { options: true } }),
    prisma.response.findMany({ where, orderBy: { submittedAt: "asc" }, include: { answers: true, branch: true } }),
  ]);

  const useArabic = query.lang === "ar";
  const optionLabelById = new Map(questions.flatMap((q) => q.options.map((o) => [o.id, useArabic ? o.labelAr : o.label] as const)));
  const headers = [
    useArabic ? "معرف الرد" : "Response ID",
    useArabic ? "الفرع" : "Branch",
    useArabic ? "تاريخ الإرسال" : "Submitted At",
    ...questions.map((q) => (useArabic ? q.labelAr : q.label)),
  ];

  const rows = responses.map((response) => {
    const answerByQuestionId = new Map(response.answers.map((a) => [a.questionId, a.value]));
    const cells = questions.map((q) => formatAnswerForExport(q, answerByQuestionId.get(q.id), optionLabelById, useArabic));
    return [response.id, useArabic ? response.branch.nameAr : response.branch.name, response.submittedAt.toISOString(), ...cells];
  });

  if (query.format === "xlsx") {
    return {
      buffer: await buildXlsx(survey.title, headers, rows),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
    };
  }
  return { buffer: Buffer.from(buildCsv(headers, rows), "utf-8"), contentType: "text/csv; charset=utf-8", extension: "csv" };
}
