import type { ReactNode } from "react";

export function ChartCard({ title, action, children, height = 260 }: { title: string; action?: ReactNode; children: ReactNode; height?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        {action}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export function EmptyChartState({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-neutral-400">{label}</div>;
}
