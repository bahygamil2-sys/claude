import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSurveys } from "./surveysApi";
import { CreateSurveyModal } from "./CreateSurveyModal";
import { useLocalized } from "@/hooks/useLocalized";
import { Button } from "@/components/Button";
import { Card, CardBody } from "@/components/Card";
import { SurveyStatusBadge } from "@/components/Badge";
import { FullPageSpinner } from "@/components/Spinner";

export default function SurveysListPage() {
  const { t } = useTranslation(["survey", "common"]);
  const pick = useLocalized();
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const isOwner = session?.actorType === "BRAND_USER" && session.user.role === "OWNER";
  const surveysQuery = useSurveys();
  const [createOpen, setCreateOpen] = useState(false);

  if (surveysQuery.isLoading) return <FullPageSpinner />;
  const surveys = surveysQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{t("list.title")}</h1>
        {isOwner && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={15} className="me-1" />
            {t("list.createSurvey")}
          </Button>
        )}
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-neutral-500">{t("list.empty")}</CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <Card
              key={survey.id}
              className="cursor-pointer transition hover:border-brand-300"
              onClick={() => navigate(`/surveys/${survey.id}/edit`)}
            >
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-neutral-900">{pick(survey.title, survey.titleAr)}</p>
                  <SurveyStatusBadge status={survey.status} label={t(`common:surveyStatus.${survey.status}`)} />
                </div>
                <div className="flex gap-3 text-xs text-neutral-500">
                  <span>{t("list.questions", { count: survey._count?.questions ?? 0 })}</span>
                  <span>{t("list.responses", { count: survey._count?.responses ?? 0 })}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {isOwner && <CreateSurveyModal open={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
