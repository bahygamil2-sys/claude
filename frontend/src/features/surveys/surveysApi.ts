import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Survey } from "@/types/api";

// List-only for now — the dashboard overview needs survey/response counts.
// Extended with create/update/publish/etc. in the survey builder UI phase.
export function useSurveys() {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: async () => (await apiClient.get<{ surveys: Survey[] }>("/surveys")).data.surveys,
  });
}
