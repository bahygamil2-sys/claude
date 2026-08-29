import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { SurveyStatusBadge } from "@/components/Badge";
import { useAuthStore } from "@/store/authStore";
import { useLocalized } from "@/hooks/useLocalized";
import { toast } from "@/store/toastStore";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/apiError";
import { QuestionList } from "./QuestionList";
import { AddQuestionMenu } from "./AddQuestionMenu";
import { BranchScopePicker } from "./BranchScopePicker";
import { SurveyPreviewPane } from "./SurveyPreviewPane";
import { draftToInput, newDraftQuestion, questionToDraft } from "./draftTypes";
import type { DraftQuestion } from "./draftTypes";
import { useCloseSurvey, useDuplicateSurvey, usePublishSurvey, useReplaceQuestions, useUpdateSurvey } from "./surveysApi";
import type { QuestionType, RestaurantBranch, Survey } from "@/types/api";

type Tab = "details" | "questions";

// Keyed by survey.id in the parent (SurveyBuilderPage) so this component's
// local draft state — shell fields, scope, and the question list the DnD
// editor and live preview both read from — always starts fresh per survey
// and never gets stomped by an unrelated background refetch.
export function SurveyBuilderForm({ survey, branches }: { survey: Survey; branches: RestaurantBranch[] }) {
  const { t } = useTranslation(["survey", "common"]);
  const navigate = useNavigate();
  const pick = useLocalized();
  const session = useAuthStore((s) => s.session);
  const isOwner = session?.actorType === "BRAND_USER" && session.user.role === "OWNER";
  const responseCount = survey._count?.responses ?? 0;
  const questionsLocked = responseCount > 0;

  const [tab, setTab] = useState<Tab>("details");
  const [shell, setShell] = useState({
    title: survey.title,
    titleAr: survey.titleAr,
    description: survey.description ?? "",
    descriptionAr: survey.descriptionAr ?? "",
    thankYouMessage: survey.thankYouMessage ?? "",
    thankYouMessageAr: survey.thankYouMessageAr ?? "",
  });
  const [scopeType, setScopeType] = useState(survey.scopeType);
  const [branchIds, setBranchIds] = useState<string[]>(survey.branchScopes?.map((b) => b.branch.id) ?? []);
  const [questions, setQuestions] = useState<DraftQuestion[]>((survey.questions ?? []).map(questionToDraft));

  const updateSurvey = useUpdateSurvey();
  const replaceQuestions = useReplaceQuestions();
  const publishSurvey = usePublishSurvey();
  const closeSurvey = useCloseSurvey();
  const duplicateSurvey = useDuplicateSurvey();

  function setShellField<K extends keyof typeof shell>(key: K, value: string) {
    setShell((prev) => ({ ...prev, [key]: value }));
  }

  async function saveDetails() {
    if (scopeType === "SPECIFIC_BRANCHES" && branchIds.length === 0) {
      toast.error(t("builder.noBranchesSelected"));
      return;
    }
    try {
      await updateSurvey.mutateAsync({
        id: survey.id,
        input: {
          title: shell.title,
          titleAr: shell.titleAr,
          description: shell.description || undefined,
          descriptionAr: shell.descriptionAr || undefined,
          thankYouMessage: shell.thankYouMessage || undefined,
          thankYouMessageAr: shell.thankYouMessageAr || undefined,
          scopeType,
          branchIds: scopeType === "SPECIFIC_BRANCHES" ? branchIds : undefined,
        },
      });
      toast.success(t("builder.detailsSaved"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function saveQuestions() {
    try {
      const updated = await replaceQuestions.mutateAsync({ id: survey.id, questions: questions.map(draftToInput) });
      setQuestions((updated.questions ?? []).map(questionToDraft));
      toast.success(t("builder.questionsSaved"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function publish() {
    try {
      await publishSurvey.mutateAsync(survey.id);
      toast.success(t("builder.published"));
    } catch (err) {
      toast.error(getApiErrorCode(err) === "BAD_REQUEST" ? t("builder.publishNeedsQuestion") : getApiErrorMessage(err));
    }
  }

  async function closeThisSurvey() {
    try {
      await closeSurvey.mutateAsync(survey.id);
      toast.success(t("builder.closed"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function duplicate() {
    try {
      const created = await duplicateSurvey.mutateAsync(survey.id);
      toast.success(t("builder.duplicated"));
      navigate(`/surveys/${created.id}/edit`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  function addQuestion(type: QuestionType) {
    setQuestions((prev) => [...prev, newDraftQuestion(type)]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/surveys")}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label={t("common:actions.back")}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900">{pick(shell.title, shell.titleAr) || "…"}</h1>
              <SurveyStatusBadge status={survey.status} label={t(`common:surveyStatus.${survey.status}`)} />
            </div>
            <p className="text-xs text-neutral-400">{t("survey:list.responses", { count: responseCount })}</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" loading={duplicateSurvey.isPending} onClick={() => void duplicate()}>
              {t("builder.duplicate")}
            </Button>
            {survey.status === "DRAFT" && (
              <Button size="sm" loading={publishSurvey.isPending} onClick={() => void publish()}>
                {t("builder.publish")}
              </Button>
            )}
            {survey.status === "PUBLISHED" && (
              <Button size="sm" variant="danger" loading={closeSurvey.isPending} onClick={() => void closeThisSurvey()}>
                {t("builder.close")}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        <button
          onClick={() => setTab("details")}
          className={clsx(
            "border-b-2 px-3 py-2 text-sm font-medium",
            tab === "details" ? "border-brand-600 text-brand-700" : "border-transparent text-neutral-500"
          )}
        >
          {t("builder.detailsTab")}
        </button>
        <button
          onClick={() => setTab("questions")}
          className={clsx(
            "border-b-2 px-3 py-2 text-sm font-medium",
            tab === "questions" ? "border-brand-600 text-brand-700" : "border-transparent text-neutral-500"
          )}
        >
          {t("builder.questionsTab")}
        </button>
      </div>

      {tab === "details" ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("builder.title")}
              disabled={!isOwner}
              value={shell.title}
              onChange={(e) => setShellField("title", e.target.value)}
            />
            <Input
              label={t("builder.titleAr")}
              disabled={!isOwner}
              value={shell.titleAr}
              onChange={(e) => setShellField("titleAr", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Textarea
              label={t("builder.description")}
              rows={2}
              disabled={!isOwner}
              value={shell.description}
              onChange={(e) => setShellField("description", e.target.value)}
            />
            <Textarea
              label={t("builder.descriptionAr")}
              rows={2}
              disabled={!isOwner}
              value={shell.descriptionAr}
              onChange={(e) => setShellField("descriptionAr", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Textarea
              label={t("builder.thankYouMessage")}
              rows={2}
              disabled={!isOwner}
              value={shell.thankYouMessage}
              onChange={(e) => setShellField("thankYouMessage", e.target.value)}
            />
            <Textarea
              label={t("builder.thankYouMessageAr")}
              rows={2}
              disabled={!isOwner}
              value={shell.thankYouMessageAr}
              onChange={(e) => setShellField("thankYouMessageAr", e.target.value)}
            />
          </div>
          <BranchScopePicker
            scopeType={scopeType}
            branchIds={branchIds}
            branches={branches}
            disabled={!isOwner}
            onChange={(nextScope, nextIds) => {
              setScopeType(nextScope);
              setBranchIds(nextIds);
            }}
          />
          {isOwner && (
            <Button loading={updateSurvey.isPending} onClick={() => void saveDetails()}>
              {t("builder.saveDetails")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            {questionsLocked && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span>{t("builder.lockedBanner")}</span>
                {isOwner && (
                  <Button size="sm" variant="outline" loading={duplicateSurvey.isPending} onClick={() => void duplicate()}>
                    {t("builder.lockedDuplicate")}
                  </Button>
                )}
              </div>
            )}
            {isOwner && !questionsLocked && <AddQuestionMenu onAdd={addQuestion} />}
            {questions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-300 py-10 text-center text-sm text-neutral-400">
                {t("builder.noQuestions")}
              </p>
            ) : (
              <QuestionList questions={questions} onChange={setQuestions} disabled={!isOwner || questionsLocked} />
            )}
            {isOwner && !questionsLocked && questions.length > 0 && (
              <Button loading={replaceQuestions.isPending} onClick={() => void saveQuestions()}>
                {t("builder.saveQuestions")}
              </Button>
            )}
          </div>
          <SurveyPreviewPane
            titleEn={shell.title}
            titleAr={shell.titleAr}
            descriptionEn={shell.description}
            descriptionAr={shell.descriptionAr}
            questions={questions}
          />
        </div>
      )}
    </div>
  );
}
