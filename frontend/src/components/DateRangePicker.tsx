import { useState } from "react";
import clsx from "clsx";

export interface DateRange {
  dateFrom?: string;
  dateTo?: string;
}

type PresetKey = "today" | "7d" | "30d" | "90d" | "all";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(key: PresetKey): DateRange {
  const today = new Date();
  const to = isoDate(today);
  if (key === "all") return {};
  if (key === "today") return { dateFrom: to, dateTo: to };
  const days = key === "7d" ? 6 : key === "30d" ? 29 : 89;
  const from = new Date(today);
  from.setDate(from.getDate() - days);
  return { dateFrom: isoDate(from), dateTo: to };
}

const PRESETS: { key: PresetKey; labelKey: string }[] = [
  { key: "today", labelKey: "Today" },
  { key: "7d", labelKey: "Last 7 days" },
  { key: "30d", labelKey: "Last 30 days" },
  { key: "90d", labelKey: "Last 90 days" },
  { key: "all", labelKey: "All time" },
];

export function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const [active, setActive] = useState<PresetKey>("30d");

  function selectPreset(key: PresetKey) {
    setActive(key);
    onChange(presetRange(key));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => selectPreset(p.key)}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            active === p.key ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          {p.labelKey}
        </button>
      ))}
      <div className="ms-1 flex items-center gap-1.5 border-s border-neutral-200 ps-2">
        <input
          type="date"
          value={value.dateFrom ?? ""}
          onChange={(e) => {
            setActive("all");
            onChange({ ...value, dateFrom: e.target.value || undefined });
          }}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
        />
        <span className="text-neutral-400">–</span>
        <input
          type="date"
          value={value.dateTo ?? ""}
          onChange={(e) => {
            setActive("all");
            onChange({ ...value, dateTo: e.target.value || undefined });
          }}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
}

export { presetRange };
