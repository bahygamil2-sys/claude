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

const ORDER_STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "info",
  READY_FOR_PICKUP: "brand",
  OUT_FOR_DELIVERY: "brand",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const RESTAURANT_STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
};

export function OrderStatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge tone={ORDER_STATUS_TONE[status] ?? "neutral"} data-testid="order-status-badge">
      {label}
    </Badge>
  );
}

export function RestaurantStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={RESTAURANT_STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}
