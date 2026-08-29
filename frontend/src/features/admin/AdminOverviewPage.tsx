import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CheckCircle2, ClipboardList, Clock, Store, TrendingUp, Users, Wallet } from "lucide-react";
import { useAdminLiveActivity, useAdminOverview, useAdminSalesOverTime } from "./adminReportsApi";
import { useAdminOpsRoom } from "@/hooks/useAdminOpsRoom";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { StatCard } from "@/components/StatCard";
import { ChartCard, EmptyChartState } from "@/components/ChartCard";
import { FilterBar } from "@/components/FilterBar";
import { DateRangePicker, presetRange, type DateRange } from "@/components/DateRangePicker";
import { useCurrency } from "@/hooks/useCurrency";
import { useLocalized } from "@/hooks/useLocalized";
import { SEQUENTIAL_BLUE, CHART_INK } from "@/lib/chartColors";
import type { LiveActivityItem } from "@/features/reports/reportTypes";

export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const currency = useCurrency();
  const pick = useLocalized();
  const qc = useQueryClient();
  const [range, setRange] = useState<DateRange>(presetRange("30d"));

  const overview = useAdminOverview(range);
  const sales = useAdminSalesOverTime({ ...range, groupBy: "day" });
  const activity = useAdminLiveActivity(20);

  useAdminOpsRoom();
  useSocketEvent<{ orderId: string }>("order:new", () => void qc.invalidateQueries({ queryKey: ["admin-live-activity"] }), [qc]);
  useSocketEvent<{ orderId: string }>("order:statusChanged", () => void qc.invalidateQueries({ queryKey: ["admin-live-activity"] }), [qc]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-neutral-900">{t("overview.title")}</h1>

      <FilterBar>
        <DateRangePicker value={range} onChange={setRange} />
      </FilterBar>

      {overview.data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("overview.statTotalOrders")} value={overview.data.totalOrders} icon={<ClipboardList size={18} />} tone="brand" />
          <StatCard label={t("overview.statRevenue")} value={currency(overview.data.totalRevenue)} icon={<Wallet size={18} />} tone="brand" />
          <StatCard label={t("overview.statAvgOrder")} value={currency(overview.data.avgOrderValue)} icon={<TrendingUp size={18} />} />
          <StatCard label={t("overview.statCustomers")} value={overview.data.totalCustomers} icon={<Users size={18} />} />
          <StatCard label={t("overview.statTotalRestaurants")} value={overview.data.totalRestaurants} icon={<Store size={18} />} />
          <StatCard label={t("overview.statActiveRestaurants")} value={overview.data.activeRestaurants} icon={<CheckCircle2 size={18} />} />
          <StatCard label={t("overview.statPendingRestaurants")} value={overview.data.pendingRestaurants} icon={<Clock size={18} />} />
          <StatCard label={t("overview.statOrdersToday")} value={overview.data.ordersToday} icon={<Activity size={18} />} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title={t("overview.salesChart")} height={300}>
            {sales.data && sales.data.series.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales.data.series} margin={{ left: -10 }}>
                  <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="revenue" stroke={SEQUENTIAL_BLUE[500]} fill={SEQUENTIAL_BLUE[500]} fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState label={t("reports.noData")} />
            )}
          </ChartCard>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 lg:col-span-1">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <h3 className="text-sm font-semibold text-neutral-800">{t("overview.liveActivity")}</h3>
          </div>
          <div className="flex max-h-[260px] flex-col gap-2.5 overflow-y-auto">
            {activity.data && activity.data.length > 0 ? (
              activity.data.map((item: LiveActivityItem) => (
                <div key={item.id} className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2 text-xs last:border-0">
                  <p className="text-neutral-700">
                    <span className="font-medium">{pick(item.restaurantName, item.restaurantNameAr)}</span> · {item.orderNumber} →{" "}
                    {t(`common:orderStatus.${item.status}`)}
                  </p>
                  <span className="shrink-0 text-neutral-400">{new Date(item.at).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-neutral-400">{t("overview.noActivity")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
