import type { ReactNode } from "react";
import clsx from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  brand: "bg-brand-100 text-brand-700",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  ...rest
}: { tone?: Tone; children: ReactNode; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONE_CLASSES[tone], className)} {...rest}>
      {children}
    </span>
  );
}

const SURVEY_STATUS_TONE: Record<string, Tone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CLOSED: "danger",
};

const BRAND_USER_STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "success",
  INVITED: "warning",
  DISABLED: "danger",
};

const BRAND_STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
};

export function SurveyStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={SURVEY_STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}

export function BrandUserStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={BRAND_USER_STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}

export function BrandStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={BRAND_STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}
