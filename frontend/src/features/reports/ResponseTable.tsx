import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useSurveyResponses, type ReportFilters, type ReportResponseAnswer, type ReportResponseItem } from "./reportsApi";
import { useLocalized } from "@/hooks/useLocalized";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

type OptionLabel = { label: string; labelAr: string };

export function ResponseTable({
  surveyId,
  filters,
  optionLabelById,
}: {
  surveyId: string;
  filters: ReportFilters;
  optionLabelById: Map<string, OptionLabel>;
}) {
  const { t } = useTranslation(["survey", "common"]);
  const pick = useLocalized();
  const [page, setPage] = useState(1);
  const [openResponse, setOpenResponse] = useState<ReportResponseItem | null>(null);
  const pageSize = 10;

  const responsesQuery = useSurveyResponses(surveyId, { ...filters, page, pageSize });
  const data = responsesQuery.data;
  const items = data?.items ?? [];

  function formatAnswerValue(answer: ReportResponseAnswer): string {
    const value = answer.value as Record<string, unknown> | null;
    switch (answer.type) {
      case "SHORT_TEXT":
      case "LONG_TEXT":
        return typeof value?.text === "string" && value.text ? value.text : "—";
      case "SINGLE_CHOICE":
      case "DROPDOWN": {
        const opt = typeof value?.optionId === "string" ? optionLabelById.get(value.optionId) : undefined;
        return opt ? pick(opt.label, opt.labelAr) : "—";
      }
      case "MULTI_CHOICE": {
        const ids = Array.isArray(value?.optionIds) ? (value.optionIds as string[]) : [];
        const labels = ids.map((id) => optionLabelById.get(id)).filter((opt): opt is OptionLabel => Boolean(opt));
        return labels.length ? labels.map((opt) => pick(opt.label, opt.labelAr)).join(", ") : "—";
      }
      case "RATING":
        return typeof value?.rating === "number" ? String(value.rating) : "—";
      case "NPS":
        return typeof value?.nps === "number" ? String(value.nps) : "—";
      case "YES_NO":
        return typeof value?.boolean === "boolean" ? t(value.boolean ? "survey:analytics.yes" : "survey:analytics.no") : "—";
      case "DATE":
        return typeof value?.date === "string" ? value.date : "—";
      default:
        return "—";
    }
  }

  return (
    <Card>
      <CardHeader className="text-sm font-semibold text-neutral-800">{t("survey:analytics.responsesTable")}</CardHeader>
      <CardBody className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">{t("common:state.empty")}</p>
        ) : (
          <div className={clsx("overflow-x-auto", responsesQuery.isFetching && "opacity-60")}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                  <th className="px-2 py-2 text-start font-medium">{t("survey:analytics.branch")}</th>
                  <th className="px-2 py-2 text-start font-medium">{t("survey:analytics.submittedAt")}</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-2 py-2 text-neutral-700">
                      {item.branchName ? pick(item.branchName, item.branchNameAr ?? item.branchName) : "—"}
                    </td>
                    <td className="px-2 py-2 text-neutral-500">{new Date(item.submittedAt).toLocaleString()}</td>
                    <td className="px-2 py-2 text-end">
                      <Button size="sm" variant="ghost" onClick={() => setOpenResponse(item)}>
                        {t("survey:analytics.viewDetails")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t("common:pagination.previous")}
            </Button>
            <span className="text-sm text-neutral-500">
              {t("common:pagination.summary", { page: data.page, totalPages: data.totalPages, total: data.total })}
            </span>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              {t("common:pagination.next")}
            </Button>
          </div>
        )}
      </CardBody>

      <Modal open={Boolean(openResponse)} onClose={() => setOpenResponse(null)} title={t("survey:analytics.responseDetail")}>
        {openResponse && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm text-neutral-500">
              <span>{openResponse.branchName ? pick(openResponse.branchName, openResponse.branchNameAr ?? openResponse.branchName) : "—"}</span>
              <span>{new Date(openResponse.submittedAt).toLocaleString()}</span>
            </div>
            {openResponse.answers.map((answer) => (
              <div key={answer.questionId} className="border-b border-neutral-100 pb-2 last:border-0">
                <p className="text-xs font-medium text-neutral-500">{pick(answer.label, answer.labelAr)}</p>
                <p className="text-sm text-neutral-800">{formatAnswerValue(answer)}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  );
}
