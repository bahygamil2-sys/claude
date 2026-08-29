import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { QuestionType, Survey, SurveyScope } from "@/types/api";

export function useSurveys() {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: async () => (await apiClient.get<{ surveys: Survey[] }>("/surveys")).data.surveys,
  });
}

export function useSurvey(id: string | undefined) {
  return useQuery({
    queryKey: ["survey", id],
    queryFn: async () => (await apiClient.get<{ survey: Survey }>(`/surveys/${id}`)).data.survey,
    enabled: Boolean(id),
  });
}

export interface SurveyShellInput {
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  thankYouMessage?: string;
  thankYouMessageAr?: string;
  scopeType?: SurveyScope;
  branchIds?: string[];
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SurveyShellInput) => (await apiClient.post<{ survey: Survey }>("/surveys", input)).data.survey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });
}

export function useUpdateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<SurveyShellInput> }) =>
      (await apiClient.patch<{ survey: Survey }>(`/surveys/${id}`, input)).data.survey,
    onSuccess: (survey) => {
      qc.invalidateQueries({ queryKey: ["survey", survey.id] });
      qc.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export interface QuestionOptionDraftInput {
  label: string;
  labelAr: string;
}

export interface QuestionDraftInput {
  type: QuestionType;
  label: string;
  labelAr: string;
  helpText?: string;
  helpTextAr?: string;
  isRequired: boolean;
  config: Record<string, unknown>;
  options: QuestionOptionDraftInput[];
}

// Full bulk-replace, matching the backend's PUT .../questions design — there is
// no per-question PATCH endpoint, so the builder edits a local draft array and
// saves it as one call.
export function useReplaceQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, questions }: { id: string; questions: QuestionDraftInput[] }) =>
      (await apiClient.put<{ survey: Survey }>(`/surveys/${id}/questions`, { questions })).data.survey,
    onSuccess: (survey) => {
      qc.invalidateQueries({ queryKey: ["survey", survey.id] });
      qc.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function usePublishSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.post<{ survey: Survey }>(`/surveys/${id}/publish`)).data.survey,
    onSuccess: (survey) => {
      qc.invalidateQueries({ queryKey: ["survey", survey.id] });
      qc.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useCloseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.post<{ survey: Survey }>(`/surveys/${id}/close`)).data.survey,
    onSuccess: (survey) => {
      qc.invalidateQueries({ queryKey: ["survey", survey.id] });
      qc.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useDuplicateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.post<{ survey: Survey }>(`/surveys/${id}/duplicate`)).data.survey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });
}
