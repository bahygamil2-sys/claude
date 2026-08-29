import type { Question, QuestionType } from "@/types/api";
import { defaultConfigFor, questionNeedsOptions } from "./questionTypeMeta";
import type { QuestionDraftInput } from "./surveysApi";

// The builder edits a local draft tree (never partially synced to the server)
// and saves it as one PUT .../questions call, matching the backend's
// bulk-replace design. `key` is a stable client-side identity for React lists
// and dnd-kit — existing questions/options reuse their real id as the key;
// newly added ones get a generated one since they have no id until saved.
export interface DraftOption {
  key: string;
  label: string;
  labelAr: string;
}

export interface DraftQuestion {
  key: string;
  type: QuestionType;
  label: string;
  labelAr: string;
  helpText: string;
  helpTextAr: string;
  isRequired: boolean;
  config: Record<string, unknown>;
  options: DraftOption[];
}

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `draft-${Date.now()}-${keyCounter}`;
}

export function newDraftOption(): DraftOption {
  return { key: nextKey(), label: "", labelAr: "" };
}

export function newDraftQuestion(type: QuestionType): DraftQuestion {
  return {
    key: nextKey(),
    type,
    label: "",
    labelAr: "",
    helpText: "",
    helpTextAr: "",
    isRequired: true,
    config: defaultConfigFor(type),
    options: questionNeedsOptions(type) ? [newDraftOption(), newDraftOption()] : [],
  };
}

export function questionToDraft(question: Question): DraftQuestion {
  return {
    key: question.id,
    type: question.type,
    label: question.label,
    labelAr: question.labelAr,
    helpText: question.helpText ?? "",
    helpTextAr: question.helpTextAr ?? "",
    isRequired: question.isRequired,
    config: question.config,
    options: question.options.map((o) => ({ key: o.id, label: o.label, labelAr: o.labelAr })),
  };
}

export function draftToInput(draft: DraftQuestion): QuestionDraftInput {
  return {
    type: draft.type,
    label: draft.label,
    labelAr: draft.labelAr,
    helpText: draft.helpText.trim() || undefined,
    helpTextAr: draft.helpTextAr.trim() || undefined,
    isRequired: draft.isRequired,
    config: draft.config,
    options: draft.options.map((o) => ({ label: o.label, labelAr: o.labelAr })),
  };
}
