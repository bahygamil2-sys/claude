import { Prisma } from "@prisma/client";
import type { RestaurantBranch, SurveyBranchLink } from "@prisma/client";
import { nanoid } from "nanoid";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { assertBranchesBelongToBrand } from "../../lib/branchAccess";
import { generateLinkToken } from "../../lib/linkToken";
import { questionConfigSchema, questionNeedsOptions } from "../../lib/questionTypes";
import { env } from "../../config/env";
import type { BrandAccessTokenPayload } from "../../lib/tokens";
import type { CreateSurveyInput, ReplaceQuestionsInput, UpdateSurveyInput } from "./surveys.schema";

async function getOwnedSurvey(brandId: string, id: string) {
  const survey = await prisma.survey.findFirst({ where: { id, brandId } });
  if (!survey) throw ApiError.notFound("Survey not found");
  return survey;
}

function toLinkDto(branch: RestaurantBranch, link: SurveyBranchLink) {
  return {
    branchId: branch.id,
    branchName: branch.name,
    branchNameAr: branch.nameAr,
    token: link.token,
    isActive: link.isActive,
    url: `${env.PUBLIC_SURVEY_BASE_URL}/r/${link.token}`,
  };
}

export async function list(user: BrandAccessTokenPayload) {
  return prisma.survey.findMany({
    where: { brandId: user.brandId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, responses: true } } },
  });
}

export async function getOne(user: BrandAccessTokenPayload, id: string) {
  const survey = await prisma.survey.findFirst({
    where: { id, brandId: user.brandId },
    include: {
      questions: { include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
      branchScopes: { include: { branch: true } },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) throw ApiError.notFound("Survey not found");
  return survey;
}

export async function create(user: BrandAccessTokenPayload, input: CreateSurveyInput) {
  if (input.scopeType === "SPECIFIC_BRANCHES") {
    await assertBranchesBelongToBrand(user.brandId, input.branchIds ?? []);
    if (!input.branchIds?.length) throw ApiError.badRequest("branchIds is required when scopeType is SPECIFIC_BRANCHES");
  }

  return prisma.survey.create({
    data: {
      brandId: user.brandId,
      title: input.title,
      titleAr: input.titleAr,
      description: input.description,
      descriptionAr: input.descriptionAr,
      thankYouMessage: input.thankYouMessage,
      thankYouMessageAr: input.thankYouMessageAr,
      scopeType: input.scopeType,
      createdByUserId: user.sub,
      branchScopes:
        input.scopeType === "SPECIFIC_BRANCHES" ? { create: (input.branchIds ?? []).map((branchId) => ({ branchId })) } : undefined,
    },
  });
}

export async function update(user: BrandAccessTokenPayload, id: string, input: UpdateSurveyInput) {
  const survey = await getOwnedSurvey(user.brandId, id);
  const nextScopeType = input.scopeType ?? survey.scopeType;

  let nextBranchIds: string[] | undefined;
  if (input.scopeType || input.branchIds) {
    if (nextScopeType === "SPECIFIC_BRANCHES") {
      nextBranchIds =
        input.branchIds ??
        (await prisma.surveyBranch.findMany({ where: { surveyId: id }, select: { branchId: true } })).map((b) => b.branchId);
      if (nextBranchIds.length === 0) throw ApiError.badRequest("branchIds is required when scopeType is SPECIFIC_BRANCHES");
      await assertBranchesBelongToBrand(user.brandId, nextBranchIds);
    } else {
      nextBranchIds = [];
    }
  }

  return prisma.$transaction(async (tx) => {
    if (nextBranchIds) {
      await tx.surveyBranch.deleteMany({ where: { surveyId: id } });
      if (nextBranchIds.length > 0) {
        await tx.surveyBranch.createMany({ data: nextBranchIds.map((branchId) => ({ surveyId: id, branchId })) });
      }
    }

    return tx.survey.update({
      where: { id },
      data: {
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        descriptionAr: input.descriptionAr,
        thankYouMessage: input.thankYouMessage,
        thankYouMessageAr: input.thankYouMessageAr,
        scopeType: input.scopeType,
      },
    });
  });
}

export async function replaceQuestions(user: BrandAccessTokenPayload, surveyId: string, input: ReplaceQuestionsInput) {
  await getOwnedSurvey(user.brandId, surveyId);

  const responseCount = await prisma.response.count({ where: { surveyId } });
  if (responseCount > 0) {
    throw ApiError.conflict("This survey already has responses — duplicate it to change its questions");
  }

  await prisma.$transaction(async (tx) => {
    await tx.question.deleteMany({ where: { surveyId } });

    for (const [index, question] of input.questions.entries()) {
      const config = questionConfigSchema(question.type).parse(question.config);
      await tx.question.create({
        data: {
          surveyId,
          type: question.type,
          label: question.label,
          labelAr: question.labelAr,
          helpText: question.helpText,
          helpTextAr: question.helpTextAr,
          isRequired: question.isRequired,
          sortOrder: index,
          config: config as Prisma.InputJsonValue,
          options: questionNeedsOptions(question.type)
            ? {
                create: question.options.map((option, optionIndex) => ({
                  label: option.label,
                  labelAr: option.labelAr,
                  // Stable machine key, independent of the display label — see schema.prisma.
                  value: nanoid(8),
                  sortOrder: optionIndex,
                })),
              }
            : undefined,
        },
      });
    }
  });

  return getOne(user, surveyId);
}

export async function publish(user: BrandAccessTokenPayload, id: string) {
  const survey = await getOwnedSurvey(user.brandId, id);
  if (survey.status !== "DRAFT") throw ApiError.conflict("Only a draft survey can be published");

  const questionCount = await prisma.question.count({ where: { surveyId: id } });
  if (questionCount === 0) throw ApiError.badRequest("Add at least one question before publishing");

  return prisma.survey.update({ where: { id }, data: { status: "PUBLISHED" } });
}

export async function close(user: BrandAccessTokenPayload, id: string) {
  const survey = await getOwnedSurvey(user.brandId, id);
  if (survey.status !== "PUBLISHED") throw ApiError.conflict("Only a published survey can be closed");
  return prisma.survey.update({ where: { id }, data: { status: "CLOSED" } });
}

export async function duplicate(user: BrandAccessTokenPayload, id: string) {
  const survey = await prisma.survey.findFirst({
    where: { id, brandId: user.brandId },
    include: { questions: { include: { options: true }, orderBy: { sortOrder: "asc" } }, branchScopes: true },
  });
  if (!survey) throw ApiError.notFound("Survey not found");

  return prisma.survey.create({
    data: {
      brandId: user.brandId,
      title: `${survey.title} (Copy)`,
      titleAr: `${survey.titleAr} (نسخة)`,
      description: survey.description,
      descriptionAr: survey.descriptionAr,
      thankYouMessage: survey.thankYouMessage,
      thankYouMessageAr: survey.thankYouMessageAr,
      status: "DRAFT",
      scopeType: survey.scopeType,
      createdByUserId: user.sub,
      branchScopes: { create: survey.branchScopes.map((scope) => ({ branchId: scope.branchId })) },
      questions: {
        create: survey.questions.map((question) => ({
          type: question.type,
          label: question.label,
          labelAr: question.labelAr,
          helpText: question.helpText,
          helpTextAr: question.helpTextAr,
          isRequired: question.isRequired,
          sortOrder: question.sortOrder,
          config: question.config as Prisma.InputJsonValue,
          options: {
            create: question.options.map((option) => ({
              label: option.label,
              labelAr: option.labelAr,
              value: option.value,
              sortOrder: option.sortOrder,
            })),
          },
        })),
      },
    },
  });
}

export async function getOrCreateLinks(user: BrandAccessTokenPayload, surveyId: string) {
  const survey = await getOwnedSurvey(user.brandId, surveyId);

  const eligibleBranches = await prisma.restaurantBranch.findMany({
    where: {
      brandId: user.brandId,
      isActive: true,
      ...(survey.scopeType === "SPECIFIC_BRANCHES" ? { surveyScopes: { some: { surveyId } } } : {}),
    },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    eligibleBranches.map(async (branch) => {
      const link = await prisma.surveyBranchLink.upsert({
        where: { surveyId_branchId: { surveyId, branchId: branch.id } },
        update: {},
        create: { surveyId, branchId: branch.id, token: generateLinkToken() },
      });
      return toLinkDto(branch, link);
    })
  );
}

export async function regenerateLink(user: BrandAccessTokenPayload, surveyId: string, branchId: string) {
  await getOwnedSurvey(user.brandId, surveyId);

  const branch = await prisma.restaurantBranch.findFirst({ where: { id: branchId, brandId: user.brandId } });
  if (!branch) throw ApiError.notFound("Branch not found");

  const existing = await prisma.surveyBranchLink.findUnique({ where: { surveyId_branchId: { surveyId, branchId } } });
  if (!existing) throw ApiError.notFound("Link not found — fetch GET /surveys/:id/links first to create it");

  const updated = await prisma.surveyBranchLink.update({ where: { id: existing.id }, data: { token: generateLinkToken() } });
  return toLinkDto(branch, updated);
}
