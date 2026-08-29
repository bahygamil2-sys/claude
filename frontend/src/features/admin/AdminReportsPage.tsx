import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdminNewSignups, useAdminOrdersByStatus, useAdminSalesOverTime, useAdminTopCategories, useAdminTopRestaurants } from "./adminReportsApi";
import { useAdminRestaurants } from "./adminApi";
import { useCategories } from "@/features/restaurants/restaurantsApi";
import { ChartCard, EmptyChartState } from "@/components/ChartCard";
import { FilterBar } from "@/components/FilterBar";
import { DateRangePicker, presetRange, type DateRange } from "@/components/DateRangePicker";
import { Input, Select } from "@/components/Input";
import { useCurrency } from "@/hooks/useCurrency";
import { useLocalized } from "@/hooks/useLocalized";
import { CATEGORICAL, CHART_INK, SEQUENTIAL_BLUE, STATUS_COLORS } from "@/lib/chartColors";

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-neutral-500">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export default function AdminReportsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const currency = useCurrency();
  const pick = useLocalized();
  const [range, setRange] = useState<DateRange>(presetRange("30d"));
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");

  const categoriesQuery = useCategories();
  const restaurantsQuery = useAdminRestaurants({ pageSize: 50 });

  const scope = { city: city || undefined, categoryId: categoryId || undefined };
  const sales = useAdminSalesOverTime({ ...range, groupBy, ...scope, restaurantId: restaurantId || undefined });
  const byStatus = useAdminOrdersByStatus({ ...range, ...scope, restaurantId: restaurantId || undefined });
  const topRestaurants = useAdminTopRestaurants({ ...range, limit: 8, ...scope });
  const topCategories = useAdminTopCategories({ ...range, limit: 8, city: city || undefined });
  const newSignups = useAdminNewSignups({ ...range, groupBy });

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
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("reports.cityPlaceholder")} className="w-32" />
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-auto">
          <option value="">{t("restaurants.allCategories")}</option>
          {categoriesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {pick(c.name, c.nameAr)}
            </option>
          ))}
        </Select>
        <Select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="w-auto">
          <option value="">{t("orders.allRestaurants")}</option>
          {restaurantsQuery.data?.items.map((r) => (
            <option key={r.id} value={r.id}>
              {pick(r.name, r.nameAr)}
            </option>
          ))}
        </Select>
      </FilterBar>

      <ChartCard title={t("overview.salesChart")}>
        {sales.data && sales.data.series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sales.data.series} margin={{ left: -10 }}>
              <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
              <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} width={65} />
              <Tooltip formatter={(v: number) => currency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill={SEQUENTIAL_BLUE[400]} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState label={t("reports.noData")} />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t("reports.topRestaurants")}>
          {topRestaurants.data && topRestaurants.data.restaurants.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRestaurants.data.restaurants.map((r) => ({ ...r, label: pick(r.name, r.nameAr) }))} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.gridline} />
                <XAxis type="number" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
                <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: CHART_INK.secondary }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => currency(v)} />
                <Bar dataKey="revenue" fill={SEQUENTIAL_BLUE[400]} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label={t("reports.noData")} />
          )}
        </ChartCard>

        <ChartCard title={t("reports.topCategories")}>
          {topCategories.data && topCategories.data.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories.data.categories.map((c) => ({ ...c, label: pick(c.name, c.nameAr) }))} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.gridline} />
                <XAxis type="number" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
                <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: CHART_INK.secondary }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => currency(v)} />
                <Bar dataKey="revenue" fill={SEQUENTIAL_BLUE[400]} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label={t("reports.noData")} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

        <ChartCard
          title={t("reports.newSignups")}
          action={
            <div className="flex gap-3">
              <LegendDot color={CATEGORICAL[0]} label={t("common:roles.CUSTOMER")} />
              <LegendDot color={CATEGORICAL[1]} label={t("common:roles.RESTAURANT_OWNER")} />
            </div>
          }
        >
          {newSignups.data && newSignups.data.series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newSignups.data.series} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
                <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="customers" fill={CATEGORICAL[0]} radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="owners" fill={CATEGORICAL[1]} radius={[3, 3, 0, 0]} maxBarSize={14} />
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
