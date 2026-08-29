import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardList, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";
import { useRestaurantDashboard } from "./RestaurantDashboardContext";
import { useRestaurantSalesOverTime, useRestaurantSummary } from "@/features/reports/restaurantReportsApi";
import { StatCard } from "@/components/StatCard";
import { ChartCard, EmptyChartState } from "@/components/ChartCard";
import { FilterBar } from "@/components/FilterBar";
import { DateRangePicker, presetRange, type DateRange } from "@/components/DateRangePicker";
import { RestaurantStatusBadge } from "@/components/Badge";
import { useCurrency } from "@/hooks/useCurrency";
import { SEQUENTIAL_BLUE, CHART_INK } from "@/lib/chartColors";

export default function RestaurantOverviewPage() {
  const { t } = useTranslation(["restaurant", "common"]);
  const currency = useCurrency();
  const { selected } = useRestaurantDashboard();
  const [range, setRange] = useState<DateRange>(presetRange("30d"));

  const summary = useRestaurantSummary(selected.id, range);
  const sales = useRestaurantSalesOverTime(selected.id, { ...range, groupBy: "day" });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-neutral-900">{t("overview.title")}</h1>
        <RestaurantStatusBadge status={selected.status} label={t(`common:restaurantStatus.${selected.status}`)} />
      </div>

      {selected.status === "PENDING" && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{t("overview.pendingApproval")}</p>}
      {selected.status === "SUSPENDED" && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{t("overview.suspended")}</p>}

      <FilterBar>
        <DateRangePicker value={range} onChange={setRange} />
      </FilterBar>

      {summary.data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("overview.statTotalOrders")} value={summary.data.totalOrders} icon={<ClipboardList size={18} />} tone="brand" />
          <StatCard label={t("overview.statRevenue")} value={currency(summary.data.totalRevenue)} icon={<Wallet size={18} />} tone="brand" />
          <StatCard label={t("overview.statAvgOrder")} value={currency(summary.data.avgOrderValue)} icon={<TrendingUp size={18} />} />
          <StatCard label={t("overview.statCompletionRate")} value={`${Math.round(summary.data.completionRate * 100)}%`} icon={<CheckCircle2 size={18} />} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t("overview.salesChart")}>
          {sales.data && sales.data.series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.data.series} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
                <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={(v: number) => currency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke={SEQUENTIAL_BLUE[500]} fill={SEQUENTIAL_BLUE[500]} fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label={t("reports.noData")} />
          )}
        </ChartCard>

        <ChartCard title={t("overview.ordersChart")}>
          {sales.data && sales.data.series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales.data.series} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
                <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} width={50} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="orders" fill={SEQUENTIAL_BLUE[400]} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label={t("reports.noData")} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
