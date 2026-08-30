import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useSurveyLinks } from "./linksApi";
import { BranchLinkCard } from "./BranchLinkCard";
import { SurveyNavTabs } from "./SurveyNavTabs";
import { FullPageSpinner } from "@/components/Spinner";
import { Card, CardBody } from "@/components/Card";

export default function SurveyLinksPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("survey");
  const session = useAuthStore((s) => s.session);
  const isOwner = session?.actorType === "BRAND_USER" && session.user.role === "OWNER";
  const linksQuery = useSurveyLinks(id);

  if (linksQuery.isLoading) return <FullPageSpinner />;
  const links = linksQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {id && <SurveyNavTabs surveyId={id} />}
      <h1 className="text-xl font-bold text-neutral-900">{t("links.title")}</h1>
      {links.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-neutral-500">{t("links.empty")}</CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <BranchLinkCard key={link.branchId} surveyId={id as string} link={link} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}
