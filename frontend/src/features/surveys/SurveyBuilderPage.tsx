import { useParams } from "react-router-dom";
import { useSurvey } from "./surveysApi";
import { useBranches } from "@/features/branches/branchesApi";
import { SurveyBuilderForm } from "./SurveyBuilderForm";
import { FullPageSpinner } from "@/components/Spinner";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function SurveyBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const surveyQuery = useSurvey(id);
  const branchesQuery = useBranches();

  if (surveyQuery.isLoading || branchesQuery.isLoading) return <FullPageSpinner />;
  if (!surveyQuery.data) return <PlaceholderPage title="Survey not found" />;

  return <SurveyBuilderForm key={surveyQuery.data.id} survey={surveyQuery.data} branches={branchesQuery.data ?? []} />;
}
