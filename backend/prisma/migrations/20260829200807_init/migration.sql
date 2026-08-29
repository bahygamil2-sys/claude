-- CreateEnum
CREATE TYPE "BrandRole" AS ENUM ('OWNER', 'MANAGER');

-- CreateEnum
CREATE TYPE "BrandUserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "BrandStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SurveyScope" AS ENUM ('ALL_BRANCHES', 'SPECIFIC_BRANCHES');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN', 'RATING', 'NPS', 'YES_NO', 'DATE');

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRefreshToken" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "status" "BrandStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandUser" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "BrandRole" NOT NULL,
    "status" "BrandUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "inviteToken" TEXT,
    "inviteTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandUserBranch" (
    "id" TEXT NOT NULL,
    "brandUserId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "BrandUserBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandUserRefreshToken" (
    "id" TEXT NOT NULL,
    "brandUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandUserRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantBranch" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "addressAr" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "cityAr" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "thankYouMessage" TEXT,
    "thankYouMessageAr" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "scopeType" "SurveyScope" NOT NULL DEFAULT 'ALL_BRANCHES',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyBranch" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "SurveyBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyBranchLink" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyBranchLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "label" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "helpText" TEXT,
    "helpTextAr" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "optionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE INDEX "AdminRefreshToken_adminId_idx" ON "AdminRefreshToken"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandUser_email_key" ON "BrandUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BrandUser_inviteToken_key" ON "BrandUser"("inviteToken");

-- CreateIndex
CREATE INDEX "BrandUser_brandId_idx" ON "BrandUser"("brandId");

-- CreateIndex
CREATE INDEX "BrandUserBranch_branchId_idx" ON "BrandUserBranch"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandUserBranch_brandUserId_branchId_key" ON "BrandUserBranch"("brandUserId", "branchId");

-- CreateIndex
CREATE INDEX "BrandUserRefreshToken_brandUserId_idx" ON "BrandUserRefreshToken"("brandUserId");

-- CreateIndex
CREATE INDEX "RestaurantBranch_brandId_idx" ON "RestaurantBranch"("brandId");

-- CreateIndex
CREATE INDEX "Survey_brandId_idx" ON "Survey"("brandId");

-- CreateIndex
CREATE INDEX "Survey_brandId_status_idx" ON "Survey"("brandId", "status");

-- CreateIndex
CREATE INDEX "SurveyBranch_branchId_idx" ON "SurveyBranch"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyBranch_surveyId_branchId_key" ON "SurveyBranch"("surveyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyBranchLink_token_key" ON "SurveyBranchLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyBranchLink_surveyId_branchId_key" ON "SurveyBranchLink"("surveyId", "branchId");

-- CreateIndex
CREATE INDEX "Question_surveyId_sortOrder_idx" ON "Question"("surveyId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_sortOrder_idx" ON "QuestionOption"("questionId", "sortOrder");

-- CreateIndex
CREATE INDEX "Response_surveyId_branchId_submittedAt_idx" ON "Response"("surveyId", "branchId", "submittedAt");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_responseId_questionId_key" ON "Answer"("responseId", "questionId");

-- AddForeignKey
ALTER TABLE "AdminRefreshToken" ADD CONSTRAINT "AdminRefreshToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "PlatformAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandUser" ADD CONSTRAINT "BrandUser_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandUserBranch" ADD CONSTRAINT "BrandUserBranch_brandUserId_fkey" FOREIGN KEY ("brandUserId") REFERENCES "BrandUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandUserBranch" ADD CONSTRAINT "BrandUserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "RestaurantBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandUserRefreshToken" ADD CONSTRAINT "BrandUserRefreshToken_brandUserId_fkey" FOREIGN KEY ("brandUserId") REFERENCES "BrandUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantBranch" ADD CONSTRAINT "RestaurantBranch_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "BrandUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyBranch" ADD CONSTRAINT "SurveyBranch_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyBranch" ADD CONSTRAINT "SurveyBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "RestaurantBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyBranchLink" ADD CONSTRAINT "SurveyBranchLink_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyBranchLink" ADD CONSTRAINT "SurveyBranchLink_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "RestaurantBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "RestaurantBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
