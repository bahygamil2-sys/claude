import { useQueries, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { QuestionType } from "@/types/api";

export interface ReportFilters {
  branchId?: string;
  from?: string;
  to?: string;
}

export interface SurveySummary {
  totalResponses: number;
  responsesByBranch: { branchId: string; branchName: string; branchNameAr: string; count: number }[];
  responsesOverTime: { date: string; count: number }[];
  questionSummaries: { questionId: string; type: QuestionType; label: string; labelAr: string; responseCount: number }[];
}

export function useSurveySummary(surveyId: string | undefined, filters: ReportFilters) {
  return useQuery({
    queryKey: ["survey-summary", surveyId, filters],
    queryFn: async () => (await apiClient.get<SurveySummary>(`/surveys/${surveyId}/report/summary`, { params: filters })).data,
    enabled: Boolean(surveyId),
  });
}

interface QuestionReportBase {
  questionId: string;
  type: QuestionType;
  label: string;
  labelAr: string;
  responseCount: number;
}
export interface TextQuestionReport extends QuestionReportBase {
  type: "SHORT_TEXT" | "LONG_TEXT";
  samples: string[];
}
export interface ChoiceQuestionReport extends QuestionReportBase {
  type: "SINGLE_CHOICE" | "DROPDOWN" | "MULTI_CHOICE";
  distribution: { optionId: string; label: string; labelAr: string; count: number; percentage: number }[];
}
export interface RatingQuestionReport extends QuestionReportBase {
  type: "RATING";
  average: number;
  max: number;
  histogram: { value: number; count: number }[];
}
export interface NpsQuestionReport extends QuestionReportBase {
  type: "NPS";
  average: number;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
}
export interface YesNoQuestionReport extends QuestionReportBase {
  type: "YES_NO";
  yes: number;
  no: number;
  yesPercentage: number;
  noPercentage: number;
}
export interface DateQuestionReport extends QuestionReportBase {
  type: "DATE";
  distribution: { date: string; count: number }[];
}

export type QuestionReport =
  | TextQuestionReport
  | ChoiceQuestionReport
  | RatingQuestionReport
  | NpsQuestionReport
  | YesNoQuestionReport
  | DateQuestionReport;

export function useQuestionReports(surveyId: string | undefined, questionIds: string[], filters: ReportFilters) {
  return useQueries({
    queries: questionIds.map((questionId) => ({
      queryKey: ["question-report", surveyId, questionId, filters],
      queryFn: async () =>
        (await apiClient.get<QuestionReport>(`/surveys/${surveyId}/report/questions/${questionId}`, { params: filters })).data,
      enabled: Boolean(surveyId),
    })),
  });
}

export interface ReportResponseAnswer {
  questionId: string;
  type: QuestionType;
  label: string;
  labelAr: string;
  value: unknown;
  optionLabel: string | null;
  optionLabelAr: string | null;
}
export interface ReportResponseItem {
  id: string;
  branchId: string;
  branchName: string | null;
  branchNameAr: string | null;
  submittedAt: string;
  answers: ReportResponseAnswer[];
}
export interface ReportResponsesPage {
  items: ReportResponseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useSurveyResponses(surveyId: string | undefined, filters: ReportFilters & { page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["survey-responses", surveyId, filters],
    queryFn: async () => (await apiClient.get<ReportResponsesPage>(`/surveys/${surveyId}/report/responses`, { params: filters })).data,
    enabled: Boolean(surveyId),
    placeholderData: (prev) => prev,
  });
}

export async function downloadSurveyExport(
  surveyId: string,
  format: "csv" | "xlsx",
  filters: ReportFilters & { lang?: "en" | "ar" }
) {
  const res = await apiClient.get(`/surveys/${surveyId}/report/export`, {
    params: { ...filters, format },
    responseType: "blob",
  });
  const blob = new Blob([res.data as BlobPart], { type: res.headers["content-type"] as string });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `survey-responses.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
