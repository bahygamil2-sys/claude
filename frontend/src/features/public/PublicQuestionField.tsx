import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useLocalized } from "@/hooks/useLocalized";
import type { PublicQuestion } from "./publicSurveyApi";
import type { AnswerValue } from "./publicValidation";

function RatingControl({
  value,
  onChange,
  max,
  inputStyle,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  max: number;
  inputStyle: string;
}) {
  if (inputStyle === "numeric") {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            className={clsx(
              "flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-medium",
              value === n ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-300 text-neutral-700"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  if (inputStyle === "slider") {
    // A native range input always has a visual position — there's no way to render
    // "unanswered" on the track itself. The underlying value stays undefined (so
    // validation still treats it as unanswered) until the respondent actually
    // drags it; the midpoint shown here is just where the handle starts.
    return (
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={1}
          max={max}
          value={value ?? Math.ceil(max / 2)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-xs text-neutral-400">
          <span>1</span>
          <span className="font-semibold text-brand-600">{value ?? "—"}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)} className="text-3xl leading-none" aria-label={String(n)}>
          <span className={value !== undefined && n <= value ? "text-amber-400" : "text-neutral-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function PublicQuestionField({
  question,
  value,
  error,
  onChange,
}: {
  question: PublicQuestion;
  value: AnswerValue;
  error?: string | null;
  onChange: (value: AnswerValue) => void;
}) {
  const { t } = useTranslation("public");
  const pick = useLocalized();
  const label = pick(question.label, question.labelAr);
  const help = pick(question.helpText ?? "", question.helpTextAr ?? "");
  const fieldClasses =
    "rounded-xl border border-neutral-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-base font-medium text-neutral-800">
        {label}
        {question.isRequired && <span className="text-red-500"> *</span>}
      </label>
      {help && <p className="text-sm text-neutral-500">{help}</p>}

      {question.type === "SHORT_TEXT" && (
        <input
          type="text"
          maxLength={500}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClasses}
        />
      )}

      {question.type === "LONG_TEXT" && (
        <textarea
          maxLength={5000}
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClasses}
        />
      )}

      {question.type === "SINGLE_CHOICE" && (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => onChange(option.id)}
              className={clsx(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-start text-base",
                value === option.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-700"
              )}
            >
              <span
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  value === option.id ? "border-brand-600" : "border-neutral-300"
                )}
              >
                {value === option.id && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
              </span>
              {pick(option.label, option.labelAr)}
            </button>
          ))}
        </div>
      )}

      {question.type === "DROPDOWN" && (
        <select value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} className={fieldClasses}>
          <option value="" disabled>
            {t("selectOption")}
          </option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>
              {pick(option.label, option.labelAr)}
            </option>
          ))}
        </select>
      )}

      {question.type === "MULTI_CHOICE" && (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => {
            const selected = Array.isArray(value) && value.includes(option.id);
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => {
                  const current = Array.isArray(value) ? value : [];
                  onChange(selected ? current.filter((id) => id !== option.id) : [...current, option.id]);
                }}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-start text-base",
                  selected ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-700"
                )}
              >
                <span
                  className={clsx(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                    selected ? "border-brand-600 bg-brand-600" : "border-neutral-300"
                  )}
                >
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {pick(option.label, option.labelAr)}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "RATING" && (
        <RatingControl
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
          max={typeof question.config.max === "number" ? question.config.max : 5}
          inputStyle={typeof question.config.inputStyle === "string" ? question.config.inputStyle : "stars"}
        />
      )}

      {question.type === "NPS" && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => onChange(n)}
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-medium",
                value === n ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-300 text-neutral-700"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {question.type === "YES_NO" && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={clsx(
              "flex-1 rounded-xl border px-4 py-3 text-base font-medium",
              value === true ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-300 text-neutral-700"
            )}
          >
            {t("yes")}
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={clsx(
              "flex-1 rounded-xl border px-4 py-3 text-base font-medium",
              value === false ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-300 text-neutral-700"
            )}
          >
            {t("no")}
          </button>
        </div>
      )}

      {question.type === "DATE" && (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClasses}
        />
      )}

      {error && <p className="text-sm text-red-600">{t(`errors.${error}`)}</p>}
    </div>
  );
}
