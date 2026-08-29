import type { ReactNode } from "react";
import clsx from "clsx";

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "brand";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      {icon && (
        <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tone === "brand" ? "bg-brand-50 text-brand-600" : "bg-neutral-100 text-neutral-500")}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-neutral-500">{label}</p>
        <p className="text-xl font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
