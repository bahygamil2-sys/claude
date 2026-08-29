import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_ACCENT, CHART_GRID, CHART_SECONDARY_INK } from "@/lib/chartTheme";

const TICK_STYLE = { fontSize: 12, fill: CHART_SECONDARY_INK };

export function ResponsesTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const { t } = useTranslation("survey");

  return (
    // dir="ltr": recharts assumes an LTR bidi context for its tick text-anchor math;
    // an inherited dir="rtl" would otherwise clip the axis labels (see QuestionReportCard's ChartFrame).
    <div dir="ltr">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={TICK_STYLE} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={TICK_STYLE} width={28} />
          <Tooltip
            formatter={(value: number) => [value, t("analytics.responsesTooltip")]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${CHART_GRID}` }}
          />
          <Area type="monotone" dataKey="count" stroke={CHART_ACCENT} strokeWidth={2} fill={CHART_ACCENT} fillOpacity={0.1} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
