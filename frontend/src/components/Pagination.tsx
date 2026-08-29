import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation("common");

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-1 pt-3">
      <span className="text-xs text-neutral-500">{t("pagination.summary", { page, totalPages, total })}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t("pagination.previous")}>
          <ChevronLeft size={15} className="rtl:rotate-180" />
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label={t("pagination.next")}>
          <ChevronRight size={15} className="rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
