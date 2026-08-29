import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRestaurantDashboard } from "./RestaurantDashboardContext";
import {
  useRestaurantOrdersByHour,
  useRestaurantOrdersByStatus,
  useRestaurantSalesOverTime,
  useRestaurantSummary,
  useRestaurantTopItems,
} from "@/features/reports/restaurantReportsApi";
import { StatCard } from "@/components/StatCard";
import { ChartCard, EmptyChartState } from "@/components/ChartCard";
import { FilterBar } from "@/components/FilterBar";
import { DateRangePicker, presetRange, type DateRange } from "@/components/DateRangePicker";
import { Select } from "@/components/Input";
import { useCurrency } from "@/hooks/useCurrency";
import { useLocalized } from "@/hooks/useLocalized";
import { CATEGORICAL, CHART_INK, SEQUENTIAL_BLUE, STATUS_COLORS } from "@/lib/chartColors";

export default function RestaurantReportsPage() {
  const { t } = useTranslation(["restaurant", "common"]);
  const currency = useCurrency();
  const pick = useLocalized();
  const { selected } = useRestaurantDashboard();
  const [range, setRange] = useState<DateRange>(presetRange("30d"));
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const summary = useRestaurantSummary(selected.id, range);
  const sales = useRestaurantSalesOverTime(selected.id, { ...range, groupBy });
  const topItems = useRestaurantTopItems(selected.id, { ...range, limit: 8 });
  const byStatus = useRestaurantOrdersByStatus(selected.id, range);
  const byHour = useRestaurantOrdersByHour(selected.id, range);

  const statusData = byStatus.data?.breakdown.map((b) => ({ ...b, label: t(`common:orderStatus.${b.status}`) })) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-neutral-900">{t("reports.title")}</h1>

      <FilterBar>
        <DateRangePicker value={range} onChange={setRange} />
        <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} className="w-auto">
          <option value="day">{t("reports.groupByDay")}</option>
          <option value="week">{t("reports.groupByWeek")}</option>
          <option value="month">{t("reports.groupByMonth")}</option>
        </Select>
      </FilterBar>

      {summary.data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("reports.totalOrders")} value={summary.data.totalOrders} />
          <StatCard label={t("reports.totalRevenue")} value={currency(summary.data.totalRevenue)} tone="brand" />
          <StatCard label={t("reports.deliveredOrders")} value={summary.data.deliveredOrders} />
          <StatCard label={t("reports.cancelledOrders")} value={summary.data.cancelledOrders} />
          <StatCard label={t("reports.avgOrderValue")} value={currency(summary.data.avgOrderValue)} />
          <StatCard label={t("reports.completionRate")} value={`${Math.round(summary.data.completionRate * 100)}%`} />
          <StatCard label={t("reports.avgPrepTime")} value={summary.data.avgPrepTimeMinutes != null ? t("common:time.minutes", { count: Math.round(summary.data.avgPrepTimeMinutes) }) : "—"} />
          <StatCard label={t("reports.newCustomers")} value={summary.data.newCustomers} />
        </div>
      )}

      <ChartCard title={t("reports.salesOverTime")}>
        {sales.data && sales.data.series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sales.data.series} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
              <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} width={55} />
              <Tooltip formatter={(v: number) => currency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill={SEQUENTIAL_BLUE[400]} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState label={t("reports.noData")} />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t("reports.topItems")}>
          {topItems.data && topItems.data.items.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems.data.items.map((i) => ({ ...i, label: pick(i.name, i.nameAr) }))} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.gridline} />
                <XAxis type="number" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: CHART_INK.secondary }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number, name) => (name === "revenue" ? currency(v) : v)} />
                <Bar dataKey="quantitySold" fill={SEQUENTIAL_BLUE[400]} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label={t("reports.noData")} />
          )}
        </ChartCard>

        <ChartCard title={t("reports.ordersByStatus")}>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.gridline} />
                <XAxis type="number" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: CHART_INK.secondary }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? CATEGORICAL[0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label={t("reports.noData")} />
          )}
        </ChartCard>
      </div>

      <ChartCard title={t("reports.ordersByHour")}>
        {byHour.data && byHour.data.hours.some((h) => h.count > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byHour.data.hours} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(h) => `${h}:00`} />
              <Bar dataKey="count" fill={SEQUENTIAL_BLUE[400]} radius={[3, 3, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState label={t("reports.noData")} />
        )}
      </ChartCard>
    </div>
  );
}
