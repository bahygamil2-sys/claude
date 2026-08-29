import type { PublicQuestion } from "./publicSurveyApi";

export type AnswerValue = string | string[] | number | boolean | undefined;
export type FormState = Record<string, AnswerValue>;

function isEmpty(value: AnswerValue): boolean {
  return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

// Mirrors backend/src/lib/questionTypes.ts's answerValueSchema — the server
// re-validates independently (never trust the client), but matching its rules
// here means a respondent sees the same rejection inline instead of only
// after a round-trip.
export function validateAnswer(question: PublicQuestion, value: AnswerValue): string | null {
  if (question.isRequired && isEmpty(value)) return "required";
  if (isEmpty(value)) return null;

  switch (question.type) {
    case "SHORT_TEXT":
      return typeof value === "string" && value.trim().length > 0 && value.length <= 500 ? null : "invalid";
    case "LONG_TEXT":
      return typeof value === "string" && value.trim().length > 0 && value.length <= 5000 ? null : "invalid";
    case "SINGLE_CHOICE":
    case "DROPDOWN":
      return typeof value === "string" && question.options.some((o) => o.id === value) ? null : "invalid";
    case "MULTI_CHOICE": {
      if (!Array.isArray(value)) return "invalid";
      const maxSelections = typeof question.config.maxSelections === "number" ? question.config.maxSelections : undefined;
      if (maxSelections && value.length > maxSelections) return "tooMany";
      return value.every((id) => question.options.some((o) => o.id === id)) ? null : "invalid";
    }
    case "RATING": {
      const max = typeof question.config.max === "number" ? question.config.max : 5;
      return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= max ? null : "invalid";
    }
    case "NPS":
      return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10 ? null : "invalid";
    case "YES_NO":
      return typeof value === "boolean" ? null : "invalid";
    case "DATE":
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? null : "invalid";
  }
}

/** Builds the POST body — unanswered optional questions are simply omitted,
 * matching what the backend expects (it only validates entries that exist). */
export function buildAnswers(questions: PublicQuestion[], form: FormState): { questionId: string; value: unknown }[] {
  const answers: { questionId: string; value: unknown }[] = [];
  for (const question of questions) {
    const value = form[question.id];
    if (isEmpty(value)) continue;
    switch (question.type) {
      case "SHORT_TEXT":
      case "LONG_TEXT":
        answers.push({ questionId: question.id, value: { text: value } });
        break;
      case "SINGLE_CHOICE":
      case "DROPDOWN":
        answers.push({ questionId: question.id, value: { optionId: value } });
        break;
      case "MULTI_CHOICE":
        answers.push({ questionId: question.id, value: { optionIds: value } });
        break;
      case "RATING":
        answers.push({ questionId: question.id, value: { rating: value } });
        break;
      case "NPS":
        answers.push({ questionId: question.id, value: { nps: value } });
        break;
      case "YES_NO":
        answers.push({ questionId: question.id, value: { boolean: value } });
        break;
      case "DATE":
        answers.push({ questionId: question.id, value: { date: value } });
        break;
    }
  }
  return answers;
}
