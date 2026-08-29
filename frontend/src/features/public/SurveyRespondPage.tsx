import { type FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocalized } from "@/hooks/useLocalized";
import { getApiErrorCode } from "@/lib/apiError";
import { Button } from "@/components/Button";
import { FullPageSpinner } from "@/components/Spinner";
import { fetchPublicSurvey, submitPublicResponse } from "./publicSurveyApi";
import { PublicQuestionField } from "./PublicQuestionField";
import { buildAnswers, validateAnswer } from "./publicValidation";
import type { AnswerValue, FormState } from "./publicValidation";

function StateMessage({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <h1 className="text-lg font-bold text-neutral-900">{title}</h1>
      {message && <p className="max-w-sm text-sm text-neutral-500">{message}</p>}
    </div>
  );
}

// The single most important screen in the app — reached by a phone camera
// scanning a QR code. One scrollable page with every question visible
// (matching SurveyHeart's pattern, not a one-question-per-screen wizard).
export default function SurveyRespondPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation("public");
  const pick = useLocalized();

  const query = useQuery({
    queryKey: ["public-survey", token],
    queryFn: () => fetchPublicSurvey(token as string),
    enabled: Boolean(token),
    retry: false,
  });

  const [form, setForm] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!token || query.isLoading) return <FullPageSpinner />;

  if (query.isError || !query.data) {
    return <StateMessage title={t("notFound")} />;
  }

  const { status, brand, survey } = query.data;

  if (status !== "PUBLISHED" || !survey) {
    return (
      <StateMessage
        title={pick(brand.name, brand.nameAr)}
        message={t(status === "DRAFT" ? "notYetAvailable" : "noLongerAccepting")}
      />
    );
  }

  if (submitted) {
    const thankYou = pick(survey.thankYouMessage ?? "", survey.thankYouMessageAr ?? "");
    return <StateMessage title={t("thankYouTitle")} message={thankYou || t("thankYouDefault")} />;
  }

  function setAnswer(questionId: string, value: AnswerValue) {
    setForm((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: null }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string | null> = {};
    let hasError = false;
    for (const question of survey!.questions) {
      const err = validateAnswer(question, form[question.id]);
      nextErrors[question.id] = err;
      if (err) hasError = true;
    }
    setErrors(nextErrors);
    if (hasError) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitPublicResponse(token as string, buildAnswers(survey!.questions, form));
      setSubmitted(true);
    } catch (err) {
      setSubmitError(getApiErrorCode(err) === "TOO_MANY_REQUESTS" ? t("rateLimited") : t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{pick(survey.title, survey.titleAr)}</h1>
        {(survey.description || survey.descriptionAr) && (
          <p className="mt-1 text-sm text-neutral-500">{pick(survey.description ?? "", survey.descriptionAr ?? "")}</p>
        )}
      </div>

      {survey.questions.map((question) => (
        <PublicQuestionField
          key={question.id}
          question={question}
          value={form[question.id]}
          error={errors[question.id]}
          onChange={(value) => setAnswer(question.id, value)}
        />
      ))}

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <Button type="submit" size="lg" loading={submitting} fullWidth>
        {t("submit")}
      </Button>
    </form>
  );
}
