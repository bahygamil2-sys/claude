import { apiClient } from "@/lib/apiClient";
import type { QuestionType } from "@/types/api";

// Unauthenticated on purpose — reuses the shared apiClient (its Bearer/refresh
// logic is simply inert here since /public/* never returns 401), rather than
// standing up a second axios instance just to prove a point.

export interface PublicOption {
  id: string;
  label: string;
  labelAr: string;
}

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  label: string;
  labelAr: string;
  helpText: string | null;
  helpTextAr: string | null;
  isRequired: boolean;
  config: Record<string, unknown>;
  options: PublicOption[];
}

export interface PublicSurvey {
  token: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  brand: { name: string; nameAr: string };
  survey?: {
    id: string;
    title: string;
    titleAr: string;
    description: string | null;
    descriptionAr: string | null;
    thankYouMessage: string | null;
    thankYouMessageAr: string | null;
    questions: PublicQuestion[];
  };
}

export async function fetchPublicSurvey(token: string): Promise<PublicSurvey> {
  const res = await apiClient.get<PublicSurvey>(`/public/surveys/${token}`);
  return res.data;
}

export async function submitPublicResponse(token: string, answers: { questionId: string; value: unknown }[]): Promise<void> {
  await apiClient.post(`/public/surveys/${token}/responses`, { answers });
}
