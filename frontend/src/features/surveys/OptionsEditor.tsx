import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { newDraftOption } from "./draftTypes";
import type { DraftOption } from "./draftTypes";

export function OptionsEditor({
  options,
  onChange,
  disabled,
}: {
  options: DraftOption[];
  onChange: (options: DraftOption[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("survey");

  function updateOption(key: string, patch: Partial<DraftOption>) {
    onChange(options.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  }
  function removeOption(key: string) {
    onChange(options.filter((o) => o.key !== key));
  }
  function addOption() {
    onChange([...options, newDraftOption()]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-700">{t("builder.options")}</span>
      {options.map((option, index) => (
        <div key={option.key} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs text-neutral-400">{index + 1}</span>
          <Input
            className="flex-1"
            placeholder={t("builder.optionPlaceholder")}
            value={option.label}
            disabled={disabled}
            onChange={(e) => updateOption(option.key, { label: e.target.value })}
          />
          <Input
            className="flex-1"
            placeholder={t("builder.optionPlaceholderAr")}
            value={option.labelAr}
            disabled={disabled}
            onChange={(e) => updateOption(option.key, { labelAr: e.target.value })}
          />
          {!disabled && options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(option.key)}
              className="shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
              aria-label={t("builder.removeOption")}
            >
              <X size={15} />
            </button>
          )}
        </div>
      ))}
      {options.length < 2 && <p className="text-xs text-amber-600">{t("builder.minOptionsHint")}</p>}
      {!disabled && (
        <Button type="button" size="sm" variant="outline" onClick={addOption}>
          <Plus size={14} className="me-1" />
          {t("builder.addOption")}
        </Button>
      )}
    </div>
  );
}
