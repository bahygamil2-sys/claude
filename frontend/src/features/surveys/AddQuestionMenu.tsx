import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Button } from "@/components/Button";
import { ALL_QUESTION_TYPES, QUESTION_TYPE_ICON } from "./questionTypeMeta";
import type { QuestionType } from "@/types/api";

export function AddQuestionMenu({ onAdd }: { onAdd: (type: QuestionType) => void }) {
  const { t } = useTranslation(["survey", "common"]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <Button type="button" onClick={() => setOpen((o) => !o)}>
        <Plus size={16} className="me-1" />
        {t("builder.addQuestion")}
      </Button>
      {open && (
        <div className="absolute start-0 top-full z-20 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1 text-xs font-semibold uppercase text-neutral-400">{t("questionTypePicker.title")}</p>
          <div className="grid grid-cols-2 gap-1">
            {ALL_QUESTION_TYPES.map((type) => {
              const Icon = QUESTION_TYPE_ICON[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onAdd(type);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <Icon size={15} className="shrink-0 text-brand-600" />
                  <span className="truncate">{t(`common:questionType.${type}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
