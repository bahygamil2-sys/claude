import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useLocalized } from "@/hooks/useLocalized";
import type { RestaurantBranch, SurveyScope } from "@/types/api";

export function BranchScopePicker({
  scopeType,
  branchIds,
  branches,
  onChange,
  disabled,
}: {
  scopeType: SurveyScope;
  branchIds: string[];
  branches: RestaurantBranch[];
  onChange: (scopeType: SurveyScope, branchIds: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("survey");
  const pick = useLocalized();

  function toggleBranch(id: string) {
    onChange(scopeType, branchIds.includes(id) ? branchIds.filter((b) => b !== id) : [...branchIds, id]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-700">{t("builder.scope")}</span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("ALL_BRANCHES", [])}
          className={clsx(
            "rounded-lg border px-3 py-2 text-sm font-medium",
            scopeType === "ALL_BRANCHES" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"
          )}
        >
          {t("builder.scopeAll")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("SPECIFIC_BRANCHES", branchIds)}
          className={clsx(
            "rounded-lg border px-3 py-2 text-sm font-medium",
            scopeType === "SPECIFIC_BRANCHES" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"
          )}
        >
          {t("builder.scopeSpecific")}
        </button>
      </div>
      {scopeType === "SPECIFIC_BRANCHES" && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 p-3">
          <span className="text-xs font-medium text-neutral-500">{t("builder.selectBranches")}</span>
          <div className="flex flex-wrap gap-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleBranch(branch.id)}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-sm",
                  branchIds.includes(branch.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"
                )}
              >
                {pick(branch.name, branch.nameAr)}
              </button>
            ))}
          </div>
          {branchIds.length === 0 && <p className="text-xs text-amber-600">{t("builder.noBranchesSelected")}</p>}
        </div>
      )}
    </div>
  );
}
