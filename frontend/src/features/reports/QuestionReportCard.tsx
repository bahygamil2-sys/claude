import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { QuestionReport } from "./reportsApi";
import { useLocalized } from "@/hooks/useLocalized";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { CHART_ACCENT, CHART_GRID, CHART_SECONDARY_INK, STATUS_CRITICAL, STATUS_GOOD, STATUS_WARNING } from "@/lib/chartTheme";

const TICK_STYLE = { fontSize: 12, fill: CHART_SECONDARY_INK };
const PERCENT_LABEL_STYLE = { fill: CHART_SECONDARY_INK, fontSize: 12 };

function truncate(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function ChartCard({ title, count, children }: { title: string; count: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        <span className="shrink-0 text-xs text-neutral-400">{count}</span>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// Charts stay LTR internally regardless of app language (bars run left-to-right,
// a standard data-viz convention even in RTL products). `dir="ltr"` here isn't
// just cosmetic: recharts computes its tick text-anchor assuming an LTR bidi
// context, and an inherited `dir="rtl"` from <html> clips category labels —
// Arabic text still shapes correctly since glyph joining is script-based, not
// direction-based.
function ChartFrame({ children }: { children: ReactNode }) {
  return <div dir="ltr">{children}</div>;
}

export function QuestionReportCard({ report }: { report: QuestionReport }) {
  const { t } = useTranslation(["survey", "common"]);
  const pick = useLocalized();
  const title = pick(report.label, report.labelAr);
  const count = t("survey:analytics.responseCount", { count: report.responseCount });

  if (report.responseCount === 0) {
    return (
      <ChartCard title={title} count={count}>
        <p className="py-6 text-center text-sm text-neutral-400">{t("common:state.empty")}</p>
      </ChartCard>
    );
  }

  switch (report.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      return (
        <ChartCard title={title} count={count}>
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {report.samples.map((sample, i) => (
              <li key={i} className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                {sample}
              </li>
            ))}
          </ul>
        </ChartCard>
      );

    case "SINGLE_CHOICE":
    case "DROPDOWN":
    case "MULTI_CHOICE": {
      const data = [...report.distribution]
        .sort((a, b) => b.count - a.count)
        .map((row) => ({ name: truncate(pick(row.label, row.labelAr)), count: row.count, percentage: row.percentage }));
      const height = Math.max(90, data.length * 40);
      return (
        <ChartCard title={title} count={count}>
          <ChartFrame>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }}>
                <CartesianGrid horizontal={false} stroke={CHART_GRID} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tick={TICK_STYLE} />
                <Bar dataKey="count" fill={CHART_ACCENT} radius={[0, 4, 4, 0]} maxBarSize={24}>
                  <LabelList dataKey="percentage" position="right" formatter={(v: number) => `${v}%`} style={PERCENT_LABEL_STYLE} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </ChartCard>
      );
    }

    case "RATING": {
      const data = report.histogram.map((row) => ({ name: String(row.value), count: row.count }));
      return (
        <ChartCard title={title} count={count}>
          <div className="mb-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900">{report.average}</span>
            <span className="text-sm text-neutral-400">
              / {report.max} · {t("survey:analytics.average")}
            </span>
          </div>
          <ChartFrame>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid vertical={false} stroke={CHART_GRID} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={TICK_STYLE} />
                <YAxis hide allowDecimals={false} />
                <Bar dataKey="count" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </ChartCard>
      );
    }

    case "NPS": {
      const data = [
        { name: t("survey:analytics.promoters"), count: report.promoters, color: STATUS_GOOD },
        { name: t("survey:analytics.passives"), count: report.passives, color: STATUS_WARNING },
        { name: t("survey:analytics.detractors"), count: report.detractors, color: STATUS_CRITICAL },
      ];
      return (
        <ChartCard title={title} count={count}>
          <div className="mb-2 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-neutral-900">{report.score}</span>
            <span className="text-sm text-neutral-400">{t("survey:analytics.npsScore")}</span>
          </div>
          <ChartFrame>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }}>
                <CartesianGrid horizontal={false} stroke={CHART_GRID} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} tick={TICK_STYLE} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {data.map((row) => (
                    <Cell key={row.name} fill={row.color} />
                  ))}
                  <LabelList dataKey="count" position="right" style={PERCENT_LABEL_STYLE} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </ChartCard>
      );
    }

    case "YES_NO": {
      const data = [
        { name: t("survey:analytics.yes"), count: report.yes, percentage: report.yesPercentage },
        { name: t("survey:analytics.no"), count: report.no, percentage: report.noPercentage },
      ];
      return (
        <ChartCard title={title} count={count}>
          <ChartFrame>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }}>
                <CartesianGrid horizontal={false} stroke={CHART_GRID} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tickLine={false} axisLine={false} tick={TICK_STYLE} />
                <Bar dataKey="count" fill={CHART_ACCENT} radius={[0, 4, 4, 0]} maxBarSize={24}>
                  <LabelList dataKey="percentage" position="right" formatter={(v: number) => `${v}%`} style={PERCENT_LABEL_STYLE} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </ChartCard>
      );
    }

    case "DATE": {
      const data = report.distribution.map((row) => ({ name: row.date, count: row.count }));
      return (
        <ChartCard title={title} count={count}>
          <ChartFrame>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid vertical={false} stroke={CHART_GRID} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...TICK_STYLE, fontSize: 10 }} />
                <YAxis hide allowDecimals={false} />
                <Bar dataKey="count" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </ChartCard>
      );
    }
  }
}
