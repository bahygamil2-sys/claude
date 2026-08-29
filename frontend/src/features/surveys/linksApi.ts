import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { SurveyBranchLink } from "@/types/api";

export function useSurveyLinks(surveyId: string | undefined) {
  return useQuery({
    queryKey: ["survey-links", surveyId],
    queryFn: async () => (await apiClient.get<{ links: SurveyBranchLink[] }>(`/surveys/${surveyId}/links`)).data.links,
    enabled: Boolean(surveyId),
  });
}

export function useRegenerateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ surveyId, branchId }: { surveyId: string; branchId: string }) =>
      (await apiClient.post<{ link: SurveyBranchLink }>(`/surveys/${surveyId}/links/${branchId}/regenerate`)).data.link,
    onSuccess: (_link, variables) => qc.invalidateQueries({ queryKey: ["survey-links", variables.surveyId] }),
  });
}
