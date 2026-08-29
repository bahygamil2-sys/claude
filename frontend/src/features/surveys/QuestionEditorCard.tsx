import { useTranslation } from "react-i18next";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/Input";
import { OptionsEditor } from "./OptionsEditor";
import { QuestionConfigPanel } from "./QuestionConfigPanel";
import { QUESTION_TYPE_ICON, questionNeedsOptions } from "./questionTypeMeta";
import type { DraftQuestion } from "./draftTypes";

interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
}

export function QuestionEditorCard({
  question,
  index,
  onChange,
  onRemove,
  disabled,
  dragHandleProps,
}: {
  question: DraftQuestion;
  index: number;
  onChange: (question: DraftQuestion) => void;
  onRemove: () => void;
  disabled?: boolean;
  dragHandleProps?: DragHandleProps;
}) {
  const { t } = useTranslation(["survey", "common"]);
  const Icon = QUESTION_TYPE_ICON[question.type];

  function set<K extends keyof DraftQuestion>(key: K, value: DraftQuestion[K]) {
    onChange({ ...question, [key]: value });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {!disabled && (
          <button
            type="button"
            className="mt-1 shrink-0 cursor-grab touch-none text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
            aria-label={t("builder.dragToReorder")}
            {...dragHandleProps?.attributes}
            {...dragHandleProps?.listeners}
          >
            <GripVertical size={18} />
          </button>
        )}
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={16} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {index + 1}. {t(`common:questionType.${question.type}`)}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={onRemove}
                className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                aria-label={t("builder.deleteQuestion")}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder={t("builder.title")}
              value={question.label}
              disabled={disabled}
              onChange={(e) => set("label", e.target.value)}
            />
            <Input
              placeholder={t("builder.titleAr")}
              value={question.labelAr}
              disabled={disabled}
              onChange={(e) => set("labelAr", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder={t("builder.helpText")}
              value={question.helpText}
              disabled={disabled}
              onChange={(e) => set("helpText", e.target.value)}
            />
            <Input
              placeholder={t("builder.helpTextAr")}
              value={question.helpTextAr}
              disabled={disabled}
              onChange={(e) => set("helpTextAr", e.target.value)}
            />
          </div>

          <QuestionConfigPanel
            type={question.type}
            config={question.config}
            disabled={disabled}
            onChange={(config) => set("config", config)}
          />

          {questionNeedsOptions(question.type) && (
            <OptionsEditor options={question.options} disabled={disabled} onChange={(options) => set("options", options)} />
          )}

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={question.isRequired}
              disabled={disabled}
              onChange={(e) => set("isRequired", e.target.checked)}
              className="accent-brand-600"
            />
            {t("builder.required")}
          </label>
        </div>
      </div>
    </div>
  );
}
