import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Gauge,
  Star,
  ToggleLeft,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { QuestionType } from "@/types/api";

// Mirrors backend/src/lib/questionTypes.ts — kept in sync by hand since the
// two run in different languages/runtimes.
export const ALL_QUESTION_TYPES: QuestionType[] = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "DROPDOWN",
  "RATING",
  "NPS",
  "YES_NO",
  "DATE",
];

const OPTION_TYPES: QuestionType[] = ["SINGLE_CHOICE", "MULTI_CHOICE", "DROPDOWN"];

export function questionNeedsOptions(type: QuestionType): boolean {
  return OPTION_TYPES.includes(type);
}

export const QUESTION_TYPE_ICON: Record<QuestionType, LucideIcon> = {
  SHORT_TEXT: Type,
  LONG_TEXT: AlignLeft,
  SINGLE_CHOICE: CircleDot,
  MULTI_CHOICE: CheckSquare,
  DROPDOWN: ChevronDown,
  RATING: Star,
  NPS: Gauge,
  YES_NO: ToggleLeft,
  DATE: Calendar,
};

/** Seed config matching the backend's own per-type defaults (see questionConfigSchema),
 * shown upfront in the UI rather than left blank until after a save round-trip. */
export function defaultConfigFor(type: QuestionType): Record<string, unknown> {
  if (type === "RATING") return { max: 5, inputStyle: "stars" };
  return {};
}
