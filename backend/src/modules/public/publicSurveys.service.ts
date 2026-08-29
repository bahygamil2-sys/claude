import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { answerValueSchema } from "../../lib/questionTypes";
import type { SubmitResponseInput } from "./publicSurveys.schema";

// Never distinguish "token doesn't exist" from "link deactivated" — both are a
// plain 404, so a scanned/guessed token can't be used to probe for structure.
async function getActiveLink(token: string) {
  const link = await prisma.surveyBranchLink.findUnique({
    where: { token },
    include: { survey: { include: { brand: true } } },
  });
  if (!link || !link.isActive) throw ApiError.notFound("Survey not found");
  return link;
}

export async function getPublicSurvey(token: string) {
  const link = await getActiveLink(token);
  const { survey } = link;

  const base = {
    token,
    status: survey.status,
    brand: { name: survey.brand.name, nameAr: survey.brand.nameAr },
  };

  if (survey.status !== "PUBLISHED") return base;

  const questions = await prisma.question.findMany({
    where: { surveyId: survey.id },
    orderBy: { sortOrder: "asc" },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  return {
    ...base,
    survey: {
      id: survey.id,
      title: survey.title,
      titleAr: survey.titleAr,
      description: survey.description,
      descriptionAr: survey.descriptionAr,
      thankYouMessage: survey.thankYouMessage,
      thankYouMessageAr: survey.thankYouMessageAr,
      questions: questions.map((question) => ({
        id: question.id,
        type: question.type,
        label: question.label,
        labelAr: question.labelAr,
        helpText: question.helpText,
        helpTextAr: question.helpTextAr,
        isRequired: question.isRequired,
        config: question.config,
        options: question.options.map((option) => ({ id: option.id, label: option.label, labelAr: option.labelAr })),
      })),
    },
  };
}

export async function submitResponse(token: string, ip: string | undefined, userAgent: string | undefined, input: SubmitResponseInput) {
  const link = await getActiveLink(token);
  if (link.survey.status !== "PUBLISHED") throw ApiError.notFound("Survey not found");

  const questions = await prisma.question.findMany({
    where: { surveyId: link.surveyId },
    include: { options: true },
  });
  const questionsById = new Map(questions.map((question) => [question.id, question]));

  const answeredIds = new Set<string>();
  for (const answer of input.answers) {
    if (answeredIds.has(answer.questionId)) throw ApiError.badRequest(`Duplicate answer for question ${answer.questionId}`);
    answeredIds.add(answer.questionId);
  }

  for (const question of questions) {
    if (question.isRequired && !answeredIds.has(question.id)) {
      throw ApiError.badRequest(`Missing required answer for question ${question.id}`);
    }
  }

  const answersData = input.answers.map((answer) => {
    const question = questionsById.get(answer.questionId);
    if (!question) throw ApiError.badRequest(`Question ${answer.questionId} does not belong to this survey`);

    const optionIds = question.options.map((option) => option.id);
    const ratingMax = (question.config as { max?: number } | null)?.max ?? 5;
    const parsed = answerValueSchema(question.type, optionIds, ratingMax).parse(answer.value);

    return {
      questionId: question.id,
      value: parsed as Prisma.InputJsonValue,
      optionId: "optionId" in parsed ? parsed.optionId : undefined,
    };
  });

  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : undefined;

  await prisma.$transaction(async (tx) => {
    const response = await tx.response.create({
      data: { surveyId: link.surveyId, branchId: link.branchId, ipHash, userAgent: userAgent?.slice(0, 300) },
    });
    await tx.answer.createMany({
      data: answersData.map((answer) => ({
        responseId: response.id,
        questionId: answer.questionId,
        value: answer.value,
        optionId: answer.optionId,
      })),
    });
  });

  return { success: true };
}
