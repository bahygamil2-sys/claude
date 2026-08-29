import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import type { DraftQuestion, DraftOption } from "./draftTypes";

type PreviewLang = "en" | "ar";

function localize(en: string, ar: string, lang: PreviewLang): string {
  return lang === "ar" ? ar || en : en || ar;
}

function PreviewControl({ question, lang }: { question: DraftQuestion; lang: PreviewLang }) {
  const optionLabel = (o: DraftOption) => localize(o.label, o.labelAr, lang) || "…";

  switch (question.type) {
    case "SHORT_TEXT":
      return <div className="h-9 rounded-lg border border-neutral-200 bg-neutral-50" />;
    case "LONG_TEXT":
      return <div className="h-16 rounded-lg border border-neutral-200 bg-neutral-50" />;
    case "SINGLE_CHOICE":
    case "DROPDOWN":
      return (
        <div className="flex flex-col gap-1.5">
          {question.options.map((o) => (
            <div key={o.key} className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="h-4 w-4 shrink-0 rounded-full border border-neutral-300" />
              {optionLabel(o)}
            </div>
          ))}
        </div>
      );
    case "MULTI_CHOICE":
      return (
        <div className="flex flex-col gap-1.5">
          {question.options.map((o) => (
            <div key={o.key} className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="h-4 w-4 shrink-0 rounded border border-neutral-300" />
              {optionLabel(o)}
            </div>
          ))}
        </div>
      );
    case "RATING": {
      const max = typeof question.config.max === "number" ? question.config.max : 5;
      return (
        <div className="flex gap-1 text-amber-400">
          {Array.from({ length: max }, (_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
      );
    }
    case "NPS":
      return (
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 text-[10px] text-neutral-500">
              {i}
            </span>
          ))}
        </div>
      );
    case "YES_NO":
      return (
        <div className="flex gap-2">
          <span className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600">
            {lang === "ar" ? "نعم" : "Yes"}
          </span>
          <span className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600">{lang === "ar" ? "لا" : "No"}</span>
        </div>
      );
    case "DATE":
      return <div className="h-9 w-36 rounded-lg border border-neutral-200 bg-neutral-50" />;
  }
}

function QuestionPreview({ question, lang }: { question: DraftQuestion; lang: PreviewLang }) {
  const label = localize(question.label, question.labelAr, lang);
  const help = localize(question.helpText, question.helpTextAr, lang);

  return (
    <div className="flex flex-col gap-1.5 border-b border-neutral-100 pb-4 last:border-0">
      <p className="text-sm font-medium text-neutral-800">
        {label || "…"}
        {question.isRequired && <span className="text-red-500"> *</span>}
      </p>
      {help && <p className="text-xs text-neutral-400">{help}</p>}
      <PreviewControl question={question} lang={lang} />
    </div>
  );
}

export function SurveyPreviewPane({
  titleEn,
  titleAr,
  descriptionEn,
  descriptionAr,
  questions,
}: {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  questions: DraftQuestion[];
}) {
  const { t } = useTranslation("survey");
  const [lang, setLang] = useState<PreviewLang>("ar");
  const title = localize(titleEn, titleAr, lang);
  const description = localize(descriptionEn, descriptionAr, lang);

  return (
    <div className="sticky top-20 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">{t("builder.preview")}</h2>
        <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLang("ar")}
            className={clsx("rounded-full px-2.5 py-1", lang === "ar" ? "bg-brand-600 text-white" : "text-neutral-500")}
          >
            عربي
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={clsx("rounded-full px-2.5 py-1", lang === "en" ? "bg-brand-600 text-white" : "text-neutral-500")}
          >
            EN
          </button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-8 border-neutral-900 bg-white shadow-xl">
        <div dir={lang === "ar" ? "rtl" : "ltr"} className="max-h-[560px] overflow-y-auto p-4">
          {questions.length === 0 ? (
            <p className="py-10 text-center text-xs text-neutral-400">{t("builder.previewEmpty")}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-base font-bold text-neutral-900">{title || "…"}</p>
                {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
              </div>
              {questions.map((q) => (
                <QuestionPreview key={q.key} question={q} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
