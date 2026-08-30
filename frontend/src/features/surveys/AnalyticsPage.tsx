import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { useSurvey } from "./surveysApi";
import { useBranches } from "@/features/branches/branchesApi";
import { downloadSurveyExport, useQuestionReports, useSurveySummary, type ReportFilters } from "@/features/reports/reportsApi";
import { ResponsesTrendChart } from "@/features/reports/ResponsesTrendChart";
import { QuestionReportCard } from "@/features/reports/QuestionReportCard";
import { ResponseTable } from "@/features/reports/ResponseTable";
import { SurveyNavTabs } from "./SurveyNavTabs";
import { useLocalized } from "@/hooks/useLocalized";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { Input, Select } from "@/components/Input";
import { Button } from "@/components/Button";
import { FullPageSpinner } from "@/components/Spinner";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(["survey", "common"]);
  const pick = useLocalized();
  const surveyQuery = useSurvey(id);
  const branchesQuery = useBranches();

  const [branchId, setBranchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  const filters: ReportFilters = useMemo(
    () => ({ branchId: branchId || undefined, from: from || undefined, to: to || undefined }),
    [branchId, from, to]
  );

  const summaryQuery = useSurveySummary(id, filters);
  const questionIds = useMemo(() => surveyQuery.data?.questions?.map((q) => q.id) ?? [], [surveyQuery.data]);
  const questionReports = useQuestionReports(id, questionIds, filters);

  const optionLabelById = useMemo(() => {
    const map = new Map<string, { label: string; labelAr: string }>();
    for (const question of surveyQuery.data?.questions ?? []) {
      for (const option of question.options) map.set(option.id, { label: option.label, labelAr: option.labelAr });
    }
    return map;
  }, [surveyQuery.data]);

  if (surveyQuery.isLoading || branchesQuery.isLoading) return <FullPageSpinner />;
  if (!surveyQuery.data) return <PlaceholderPage title="Survey not found" />;
  const survey = surveyQuery.data;

  async function handleExport(format: "csv" | "xlsx") {
    if (!id) return;
    setExporting(format);
    try {
      await downloadSurveyExport(id, format, { ...filters, lang: i18n.language === "ar" ? "ar" : "en" });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SurveyNavTabs surveyId={survey.id} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{pick(survey.title, survey.titleAr)}</h1>
          <p className="text-sm text-neutral-500">{t("analytics.title")}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" loading={exporting === "csv"} onClick={() => void handleExport("csv")}>
            <Download size={14} className="me-1" />
            {t("analytics.exportCsv")}
          </Button>
          <Button size="sm" variant="outline" loading={exporting === "xlsx"} onClick={() => void handleExport("xlsx")}>
            <Download size={14} className="me-1" />
            {t("analytics.exportExcel")}
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Select
            label={t("analytics.filterBranch")}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-auto min-w-[180px]"
          >
            <option value="">{t("analytics.allBranches")}</option>
            {(branchesQuery.data ?? []).map((branch) => (
              <option key={branch.id} value={branch.id}>
                {pick(branch.name, branch.nameAr)}
              </option>
            ))}
          </Select>
          <Input type="date" label={t("analytics.filterFrom")} value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
          <Input type="date" label={t("analytics.filterTo")} value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        </CardBody>
      </Card>

      {summaryQuery.isLoading || !summaryQuery.data ? (
        <FullPageSpinner />
      ) : (
        <>
          <div className="max-w-xs">
            <StatCard label={t("analytics.totalResponses")} value={summaryQuery.data.totalResponses} tone="brand" />
          </div>

          {summaryQuery.data.totalResponses === 0 ? (
            <Card>
              <CardBody className="py-10 text-center text-sm text-neutral-500">{t("analytics.noResponses")}</CardBody>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="text-sm font-semibold text-neutral-800">{t("analytics.responsesOverTime")}</CardHeader>
                <CardBody>
                  <ResponsesTrendChart data={summaryQuery.data.responsesOverTime} />
                </CardBody>
              </Card>

              {questionReports.some((q) => q.isLoading) ? (
                <FullPageSpinner />
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {questionReports.map((query, i) =>
                    query.data ? <QuestionReportCard key={questionIds[i]} report={query.data} /> : null
                  )}
                </div>
              )}

              <ResponseTable surveyId={id as string} filters={filters} optionLabelById={optionLabelById} />
            </>
          )}
        </>
      )}
    </div>
  );
}
