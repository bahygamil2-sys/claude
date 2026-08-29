// Hand-mirrored subset of backend/prisma/schema.prisma + API response shapes.

export type BrandRole = "OWNER" | "MANAGER";
export type BrandUserStatus = "ACTIVE" | "INVITED" | "DISABLED";
export type BrandStatus = "ACTIVE" | "SUSPENDED";
export type SurveyStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type SurveyScope = "ALL_BRANCHES" | "SPECIFIC_BRANCHES";
export type QuestionType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "SINGLE_CHOICE"
  | "MULTI_CHOICE"
  | "DROPDOWN"
  | "RATING"
  | "NPS"
  | "YES_NO"
  | "DATE";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandUser {
  id: string;
  brandId: string;
  email: string;
  name: string;
  role: BrandRole;
  status: BrandUserStatus;
  createdAt: string;
  updatedAt: string;
}

// Two separate JWT actor types (see backend/src/lib/tokens.ts) — every part of the
// frontend that cares "who is logged in" branches on actorType, never assumes one.
export type AuthSession = { actorType: "ADMIN"; user: AdminUser } | { actorType: "BRAND_USER"; user: BrandUser };

export interface Brand {
  id: string;
  name: string;
  nameAr: string;
  logoUrl: string | null;
  description: string | null;
  descriptionAr: string | null;
  status: BrandStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantBranch {
  id: string;
  brandId: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  city: string;
  cityAr: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  labelAr: string;
  value: string;
  sortOrder: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  labelAr: string;
  helpText: string | null;
  helpTextAr: string | null;
  isRequired: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
  options: QuestionOption[];
}

export interface Survey {
  id: string;
  brandId: string;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  thankYouMessage: string | null;
  thankYouMessageAr: string | null;
  status: SurveyStatus;
  scopeType: SurveyScope;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  branchScopes?: { branch: RestaurantBranch }[];
  _count?: { questions: number; responses: number };
}

export interface SurveyBranchLink {
  branchId: string;
  branchName: string;
  branchNameAr: string;
  token: string;
  isActive: boolean;
  url: string;
}

export interface SurveyAnswer {
  questionId: string;
  type: QuestionType;
  label: string;
  labelAr: string;
  value: unknown;
  optionLabel: string | null;
  optionLabelAr: string | null;
}

export interface SurveyResponse {
  id: string;
  branchId: string;
  branchName: string | null;
  branchNameAr: string | null;
  submittedAt: string;
  answers: SurveyAnswer[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
