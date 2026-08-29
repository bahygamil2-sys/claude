import { useTranslation } from "react-i18next";
import { Input, Select } from "@/components/Input";
import type { QuestionType } from "@/types/api";

export function QuestionConfigPanel({
  type,
  config,
  onChange,
  disabled,
}: {
  type: QuestionType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("survey");

  if (type === "RATING") {
    const max = typeof config.max === "number" ? config.max : 5;
    const inputStyle = typeof config.inputStyle === "string" ? config.inputStyle : "stars";
    return (
      <div className="grid grid-cols-2 gap-3">
        <Select
          label={t("builder.ratingMax")}
          disabled={disabled}
          value={max}
          onChange={(e) => onChange({ ...config, max: Number(e.target.value) })}
        >
          {Array.from({ length: 8 }, (_, i) => i + 3).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
        <Select
          label={t("builder.ratingStyle")}
          disabled={disabled}
          value={inputStyle}
          onChange={(e) => onChange({ ...config, inputStyle: e.target.value })}
        >
          <option value="stars">{t("builder.ratingStyleStars")}</option>
          <option value="slider">{t("builder.ratingStyleSlider")}</option>
          <option value="numeric">{t("builder.ratingStyleNumeric")}</option>
        </Select>
      </div>
    );
  }

  if (type === "MULTI_CHOICE") {
    const maxSelections = typeof config.maxSelections === "number" ? config.maxSelections : "";
    return (
      <Input
        type="number"
        min={1}
        label={t("builder.maxSelections")}
        disabled={disabled}
        value={maxSelections}
        onChange={(e) =>
          onChange(e.target.value ? { ...config, maxSelections: Number(e.target.value) } : { ...config, maxSelections: undefined })
        }
      />
    );
  }

  return null;
}
