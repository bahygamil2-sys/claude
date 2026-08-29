import { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types/api";

export function getApiErrorCode(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.code ?? "GENERIC";
  }
  return "GENERIC";
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Unknown error";
}
