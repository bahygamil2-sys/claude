import type { ReactNode } from "react";

/** One consistent row of filter controls, used above every report/list screen. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">{children}</div>;
}
